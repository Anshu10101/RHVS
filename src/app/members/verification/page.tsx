"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Shield, User, Phone, Home, IdCard } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

const updateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  father_husband_name: z.string().min(2, "Father/Husband name is required"),
  mother_wife_name: z.string().min(2, "Mother/Wife name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(10, "Address must be at least 10 characters"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;
type UpdateFormData = z.infer<typeof updateSchema>;

interface MemberSelfView {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  father_husband_name: string;
  mother_wife_name: string;
  member_reg_number: string;
  registration_date: string;
  state?: string | null;
  district?: string | null;
  profile_photo_path?: string | null;
  name_change_count?: number;
  max_name_changes?: number;
}

export default function MemberSelfVerificationPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [emailForOTP, setEmailForOTP] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<MemberSelfView | null>(null);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const updateForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateSchema),
  });

  const handleSendOTP = async (data: EmailFormData) => {
    setSending(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-otp",
          data: { email: data.email },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({
          title: "Email not found",
          description: json.message || "This email is not registered as a member.",
          variant: "destructive",
        });
        return;
      }
      setEmailForOTP(data.email);
      setStep("otp");
      toast({
        title: "OTP sent",
        description: "Please check your email for the verification OTP.",
      });
    } catch (err) {
      console.error("Self-verification send OTP error:", err);
      toast({
        title: "Failed to send OTP",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (data: OTPFormData) => {
    setVerifying(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          data: { email: emailForOTP, otp: data.otp },
        }),
      });
      const json = await res.json();
      if (!json.success || !json.member) {
        toast({
          title: "Invalid or expired OTP",
          description: json.message || "Please request a new OTP and try again.",
          variant: "destructive",
        });
        return;
      }

      const m = json.member as MemberSelfView;
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
      console.error("Self-verification verify OTP error:", err);
      toast({
        title: "Verification failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async (data: UpdateFormData) => {
    if (!member) return;
    setSaving(true);
    try {
      const res = await fetch("/api/members/self-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-details",
          data: {
            memberId: member.id,
            ...data,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast({
          title: "Update failed",
          description: json.message || "Unable to update your details.",
          variant: "destructive",
        });
        return;
      }

      const updated: MemberSelfView = {
        ...member,
        ...data,
        name_change_count: json.name_change_count ?? member.name_change_count,
        max_name_changes: json.max_name_changes ?? member.max_name_changes,
      };
      setMember(updated);

      if (json.membershipEmailSent) {
        toast({
          title: "Details updated & email sent",
          description:
            "Your details have been updated and a new membership certificate and ID card have been emailed to you.",
        });
      } else {
        toast({
          title: "Details updated",
          description: "Your member details have been updated successfully.",
        });
      }
    } catch (err) {
      console.error("Self-verification update error:", err);
      toast({
        title: "Update failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fefaf6] text-slate-900">
      <div className="container mx-auto px-3 sm:px-4 max-w-3xl py-6 sm:py-10">
        <div className="text-center mb-6 sm:mb-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Member Self Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Verify your registered email, view your membership details, and update your basic information securely.
          </p>
        </div>

        {step === "email" && (
          <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" />
                Verify your email
              </CardTitle>
              <CardDescription>Enter your registered email address to receive a verification OTP.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your registered email"
                            {...field}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={sending} className="w-full bg-orange-600 hover:bg-orange-700">
                    {sending ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "otp" && (
          <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Enter OTP
              </CardTitle>
              <CardDescription>
                An OTP has been sent to <span className="font-semibold">{emailForOTP}</span>. Enter it below to
                continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
                  <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OTP</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={6}
                            placeholder="6-digit OTP"
                            {...field}
                            className="h-11 text-center tracking-[0.5em] font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={verifying} className="w-full bg-orange-600 hover:bg-orange-700">
                    {verifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setStep("email");
                      otpForm.reset();
                    }}
                  >
                    Change email
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "details" && member && (
          <div className="space-y-6">
            <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  Your Membership Details
                </CardTitle>
                <CardDescription>Review your current membership information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Member Name</p>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Member Reg. No.</p>
                    <p className="font-mono text-orange-700 font-semibold">{member.member_reg_number}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Email</p>
                    <p className="text-slate-800 break-all">{member.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Phone</p>
                    <p className="text-slate-800">{member.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Registration Date</p>
                    <p className="text-slate-800">
                      {member.registration_date
                        ? new Date(member.registration_date).toLocaleDateString("en-IN")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Location</p>
                    <p className="text-slate-800">
                      {member.district && member.state
                        ? `${member.district}, ${member.state}`
                        : member.state || member.district || "N/A"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Address</p>
                  <p className="text-slate-800 whitespace-pre-wrap">{member.address}</p>
                </div>
                {typeof member.name_change_count === "number" && typeof member.max_name_changes === "number" && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2">
                    Name changes used:{" "}
                    <span className="font-semibold">
                      {member.name_change_count} / {member.max_name_changes}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-100 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="h-5 w-5 text-orange-500" />
                  Update Basic Details
                </CardTitle>
                <CardDescription>
                  You can update your name (max 3 times), father/mother name, phone number and address. If you change
                  your name, a new membership certificate and ID card will be emailed to you with the updated name.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...updateForm}>
                  <form onSubmit={updateForm.handleSubmit(handleSave)} className="space-y-4">
                    <FormField
                      control={updateForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11" />
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
                          <FormLabel>Father / Husband Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11" />
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
                          <FormLabel>Mother / Wife Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11" />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-11" />
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
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700">
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}


