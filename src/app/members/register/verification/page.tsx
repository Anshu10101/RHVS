"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Mail,
  User,
  Phone,
  Home,
  UserRound,
  IdCard,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

type MemberDetails = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  father_husband_name: string;
  mother_wife_name: string;
  member_reg_number: string;
  registration_date: string;
  state: string | null;
  district: string | null;
  profile_photo_path: string | null;
  name_change_count: number;
  max_name_changes: number;
};

export default function MemberSelfVerificationPage() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [loading, setLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [updateDone, setUpdateDone] = useState(false);
  const [lastUpdateNameChanged, setLastUpdateNameChanged] = useState(false);

  const remainingNameChanges =
    member && typeof member.max_name_changes === "number"
      ? Math.max(member.max_name_changes - member.name_change_count, 0)
      : null;

  // Create schemas with translations
  const sendOtpSchema = z.object({
    email: z.string().email(t('selfVerification.emailRequired')),
  });

  const verifyOtpSchema = sendOtpSchema.extend({
    otp: z
      .string()
      .min(6, t('selfVerification.otpRequired'))
      .max(6, t('selfVerification.otpRequired')),
  });

  const updateSchema = z.object({
    name: z.string().min(2, t('selfVerification.nameMinLength')),
    father_husband_name: z.string().min(2, t('selfVerification.fieldRequired')),
    mother_wife_name: z.string().min(2, t('selfVerification.fieldRequired')),
    phone: z.string().min(10, t('selfVerification.phoneMinLength')),
    address: z.string().min(10, t('selfVerification.addressMinLength')),
  });

  const sendOtpForm = useForm<z.infer<typeof sendOtpSchema>>({
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof verifyOtpSchema>>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp: "" },
  });

  const updateForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
  });

  const handleSendOtp = async (values: z.infer<typeof sendOtpSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-otp", data: { email: values.email } }),
      });
      const data = await res.json();
      if (!data.success) {
        sendOtpForm.setError("email", {
          message: data.message || t('selfVerification.failedToSendOtp'),
        });
        return;
      }
      setCurrentEmail(values.email);
      otpForm.setValue("email", values.email);
      setStep("otp");
      toast({
        title: t('selfVerification.otpSent'),
        description: t('selfVerification.otpSentDesc'),
      });
    } catch (err) {
      console.error(err);
      sendOtpForm.setError("email", {
        message: t('selfVerification.failedToSendOtp'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (values: z.infer<typeof verifyOtpSchema>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-otp", data: { email: values.email, otp: values.otp } }),
      });
      const data = await res.json();
      if (!data.success) {
        otpForm.setError("otp", {
          message: data.message || t('selfVerification.invalidOtp'),
        });
        return;
      }

      const m: MemberDetails = data.member;
      setMember(m);
      updateForm.reset({
        name: m.name,
        father_husband_name: m.father_husband_name,
        mother_wife_name: m.mother_wife_name,
        phone: m.phone,
        address: m.address,
      });
      setStep("details");
    } catch (err) {
      console.error(err);
      otpForm.setError("otp", {
        message: t('selfVerification.failedToVerifyOtp'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values: z.infer<typeof updateSchema>) => {
    if (!member) return;
    const nameChanged = values.name.trim() !== member.name;
    setLoading(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-details",
          data: {
            memberId: member.id,
            ...values,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const message = data.message || t('selfVerification.failedToUpdateWithLimit');

        updateForm.setError("root", { message });

        toast({
          title: t('selfVerification.nameChangeLimitReached'),
          description: t('selfVerification.nameChangeLimitReachedDesc'),
          variant: "destructive",
        });
        return;
      }

      const updated: MemberDetails = {
        ...member,
        ...values,
        name_change_count: data.name_change_count ?? member.name_change_count,
        max_name_changes: data.max_name_changes ?? member.max_name_changes,
      };
      setMember(updated);
      setUpdateDone(true);
      setLastUpdateNameChanged(nameChanged && !!data.membershipEmailSent);
    } catch (err) {
      console.error(err);
      updateForm.setError("root", {
        message: t('selfVerification.failedToUpdate'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefaf6] text-slate-900">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-3xl py-5 sm:py-7 md:py-10">
        <div className="text-center mb-5 sm:mb-7 md:mb-8 space-y-2 sm:space-y-3 px-1 sm:px-2">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-snug">
            {t('selfVerification.title')}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('selfVerification.description')}
          </p>
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                {t('selfVerification.emailVerificationTitle')}
              </CardTitle>
              <CardDescription>
                {t('selfVerification.emailVerificationDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <Form {...sendOtpForm}>
                <form
                  onSubmit={sendOtpForm.handleSubmit(handleSendOtp)}
                  className="space-y-3 sm:space-y-4"
                >
                  <FormField
                    control={sendOtpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('selfVerification.email')}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t('selfVerification.emailPlaceholder')}
                            {...field}
                            className="h-11 w-full text-sm sm:text-base"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white h-11 text-sm sm:text-base"
                  >
                    {loading ? t('selfVerification.sendingOtp') : t('selfVerification.sendOtp')}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white mt-4 sm:mt-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                {t('selfVerification.otpVerificationTitle')}
              </CardTitle>
              <CardDescription>
                {t('selfVerification.otpSentTo')} <span className="font-semibold">{currentEmail}</span>. {t('selfVerification.otpSentToContinue')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4">
              <Form {...otpForm}>
                <form
                  onSubmit={otpForm.handleSubmit(handleVerifyOtp)}
                  className="space-y-3 sm:space-y-4"
                >
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={6}
                            className="h-11 text-center tracking-[0.5em] font-mono text-base sm:text-lg"
                            placeholder="••••••"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={loading}
                      onClick={() => {
                        setStep("email");
                        otpForm.reset({ email: "", otp: "" });
                      }}
                      className="h-11 flex-1 text-sm sm:text-base"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('selfVerification.changeEmail')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-11 flex-1 bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base"
                    >
                      {loading ? t('selfVerification.verifying') : t('selfVerification.verifyOtp')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Details card + limited edit */}
        {step === "details" && member && (
          <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white mt-4 sm:mt-5">
            <CardHeader className="relative">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5 text-orange-500" />
                    {t('selfVerification.memberDetails')}
                  </CardTitle>
                  <CardDescription>
                    {updateDone ? t('selfVerification.latestDetails') : t('selfVerification.reviewDetails')}
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-slate-500 border-slate-200"
                  onClick={() => {
                    setStep("email");
                    setMember(null);
                    setUpdateDone(false);
                    setLastUpdateNameChanged(false);
                  }}
                >
                  <span className="sr-only">{t('selfVerification.close')}</span>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {updateDone && (
                <div className="border border-green-200 bg-green-50 rounded-xl p-3 text-xs sm:text-sm text-green-800 flex flex-col gap-1">
                  <span className="font-semibold">
                    {t('selfVerification.detailsUpdated')}
                  </span>
                  {lastUpdateNameChanged && (
                    <span>
                      {t('selfVerification.nameUpdated')}
                    </span>
                  )}
                </div>
              )}
              {/* Read-only summary card */}
              <div className="border border-slate-100 rounded-xl p-3 sm:p-4 bg-slate-50">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                      {member.profile_photo_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.profile_photo_path}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <User className="h-10 w-10 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-slate-900 break-words">
                          {member.name}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 break-all">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase">
                          {t('selfVerification.regNo')}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-orange-700 break-all">
                          {member.member_reg_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold">{t('selfVerification.registeredOn')}: </span>
                        {new Date(member.registration_date).toLocaleDateString("en-IN")}
                      </p>
                      {(member.district || member.state) && (
                        <p>
                          <span className="font-semibold">{t('selfVerification.location')}: </span>
                          {member.district && member.state
                            ? `${member.district}, ${member.state}`
                            : member.district || member.state}
                        </p>
                      )}
                      {remainingNameChanges !== null && (
                        <p className="flex flex-wrap items-center gap-1.5 text-slate-700">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>
                            {t('selfVerification.nameChangesRemaining')}{" "}
                            <span className="font-semibold">
                              {remainingNameChanges}{" "}
                              {remainingNameChanges === 1 ? t('selfVerification.time') : t('selfVerification.times')}
                            </span>{" "}
                            ({t('selfVerification.maxChanges')} {member.max_name_changes} {t('selfVerification.inTotal')}).
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable fields form */}
              {!updateDone && (
                <Form {...updateForm}>
                  <form
                    onSubmit={updateForm.handleSubmit(handleUpdate)}
                    className="space-y-3 sm:space-y-4"
                  >
                    <FormField
                      control={updateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <UserRound className="h-4 w-4 text-orange-500" />
                            {t('selfVerification.fullName')}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="father_husband_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('selfVerification.fatherHusbandName')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="mother_wife_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('selfVerification.motherWifeName')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-orange-500" />
                            {t('selfVerification.mobileNumber')}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11 text-sm sm:text-base" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={updateForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            <Home className="h-4 w-4 text-orange-500" />
                            {t('selfVerification.address')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              className="text-sm sm:text-base min-h-[80px] sm:min-h-[96px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white text-sm sm:text-base"
                    >
                      {loading ? t('selfVerification.saving') : t('selfVerification.saveChanges')}
                    </Button>
                    {updateForm.formState.errors.root && (
                      <p className="text-sm text-red-600">{updateForm.formState.errors.root.message}</p>
                    )}
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


