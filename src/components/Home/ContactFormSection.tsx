"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  MessageCircle,
  User,
  Phone,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Badge,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "@/styles/animated-button.css";

type TopicKey =
  | "membership"
  | "certificate"
  | "email_issue"
  | "content_issue"
  | "technical"
  | "store_issue"
  | "complaint"
  | "feedback"
  | "other";

interface RecipientOption {
  id: number;
  name: string;
  email: string;
  district?: string | null;
  state?: string | null;
}

interface RecipientsResponse {
  success: boolean;
  data?: {
    superadmins: RecipientOption[];
    districtAdmins: RecipientOption[];
  };
}

interface State {
  id: number;
  code: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

export function ContactFormSection() {
  const { t, language } = useLanguage();
  
  // Helper function to split text into characters for animation
  // Uses Intl.Segmenter for proper grapheme cluster handling (important for Hindi/Devanagari)
  const splitText = (text: string) => {
    // Check if Intl.Segmenter is available (modern browsers)
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      try {
        // Use Intl.Segmenter for proper Unicode grapheme segmentation
        // This handles complex scripts like Devanagari correctly
        const segmenter = new Intl.Segmenter('hi', { granularity: 'grapheme' });
        const segments = Array.from(segmenter.segment(text));
        
        return segments.map((segment, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties}>
            {segment.segment === ' ' ? '\u00A0' : segment.segment}
          </span>
        ));
      } catch (e) {
        // Fallback if Segmenter fails
        console.warn('Intl.Segmenter not available, using fallback');
      }
    }
    
    // Fallback: Use regex to match grapheme clusters (works for most cases)
    // This regex matches Devanagari characters with their combining marks
    const graphemeRegex = /(\p{L}\p{M}*|\p{N}|\p{P}|\s)/gu;
    const matches = text.match(graphemeRegex) || [];
    
    return matches.map((char, index) => (
      <span key={index} style={{ "--i": index } as React.CSSProperties}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));
  };
  
  const sendMessageText = t('contact.form.submitButton'); // "संदेश भेजें" / "Send Message"
  const sentText = language === 'hi' ? 'भेज दिया' : 'Sent';
  
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipients, setRecipients] = useState<RecipientsResponse["data"] | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    memberRegNumber: "",
    topicKey: "membership" as TopicKey,
    customTopic: "",
    message: "",
    targetType: "superadmin" as "superadmin" | "district_admin",
    selectedState: "" as string,
    selectedStateName: "" as string,
    selectedDistrict: "" as string,
    selectedDistrictName: "" as string,
    districtAdminId: "" as string,
  });

  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        setLoadingRecipients(true);
        const res = await fetch(`/api/contact/recipients?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API error response:", {
            status: res.status,
            statusText: res.statusText,
            body: errorText
          });
          return;
        }
        
        const data = (await res.json()) as RecipientsResponse;
        console.log("📥 API response:", data);
        
        if (data.success && data.data) {
          console.log("✅ Recipients loaded:", {
            superadmins: data.data.superadmins.length,
            districtAdmins: data.data.districtAdmins.length,
            admins: data.data.districtAdmins.map(a => ({ state: a.state, district: a.district }))
          });
          setRecipients(data.data);
        } else {
          console.error("❌ Failed to load recipients:", {
            success: data.success,
            error: (data as any).error,
            details: (data as any).details,
            fullResponse: data
          });
        }
      } catch (err) {
        console.error("❌ Failed to load contact recipients", err);
      } finally {
        setLoadingRecipients(false);
      }
    };

    const loadStates = async () => {
      try {
        setLoadingStates(true);
        const res = await fetch(`/api/states?_t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.success && data.data) {
          setStates(data.data);
        }
      } catch (err) {
        console.error("Failed to load states", err);
      } finally {
        setLoadingStates(false);
      }
    };

    loadRecipients();
    loadStates();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!form.selectedState) {
        setDistricts([]);
        setForm((prev) => ({ ...prev, selectedDistrict: "", districtAdminId: "" }));
        return;
      }

      // Wait for recipients to be loaded before filtering
      if (!recipients) {
        return;
      }

      try {
        setLoadingDistricts(true);
        const res = await fetch(
          `/api/districts?stateId=${form.selectedState}&_t=${Date.now()}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (data.success && data.data) {
          // Show all districts (no filtering)
          setDistricts(data.data);
        } else {
          setDistricts([]);
        }
      } catch (err) {
        console.error("Failed to load districts", err);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [form.selectedState, states, recipients]);

  // Reload districts when recipients change (in case recipients load after state is selected)
  useEffect(() => {
    if (form.selectedState && recipients && districts.length === 0) {
      // Trigger reload if we have a state selected but no districts shown
      const loadDistricts = async () => {
        try {
          setLoadingDistricts(true);
          const res = await fetch(
            `/api/districts?stateId=${form.selectedState}&_t=${Date.now()}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (data.success && data.data) {
            // Show all districts (no filtering)
            setDistricts(data.data);
          }
        } catch (err) {
          console.error("Failed to reload districts", err);
        } finally {
          setLoadingDistricts(false);
        }
      };
      loadDistricts();
    }
  }, [recipients, form.selectedState, states, districts.length]);

  const handleChange = (
    field: keyof typeof form,
    value: string | TopicKey | "superadmin" | "district_admin"
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (field === "topicKey" && value !== "other") {
      setForm((prev) => ({ ...prev, customTopic: "" }));
    }
    if (field === "targetType" && value === "superadmin") {
      setForm((prev) => ({
        ...prev,
        selectedState: "",
        selectedStateName: "",
        selectedDistrict: "",
        selectedDistrictName: "",
        districtAdminId: "",
      }));
    }
    if (field === "selectedState") {
      setForm((prev) => ({
        ...prev,
        selectedDistrict: "",
        selectedDistrictName: "",
        districtAdminId: "",
      }));
    }
    if (field === "selectedDistrict") {
      setForm((prev) => ({ ...prev, districtAdminId: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setButtonClicked(true);
    setSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
        setErrorMessage(t("contact.form.validationRequired"));
        setSubmitting(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        memberRegNumber: form.memberRegNumber.trim() || undefined,
        topicKey: form.topicKey,
        customTopic:
          form.topicKey === "other" ? form.customTopic.trim() || undefined : undefined,
        message: form.message.trim(),
        targetType: form.targetType,
        // Send district/state names for API to lookup the admin
        districtName: form.targetType === "district_admin" ? form.selectedDistrictName : undefined,
        stateName: form.targetType === "district_admin" ? form.selectedStateName : undefined,
        districtAdminId:
          form.targetType === "district_admin" && form.districtAdminId
            ? Number(form.districtAdminId)
            : undefined,
      };

      const res = await fetch("/api/contact/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data?.error || "Failed to send message";
        // Check if it's the "no admin" error
        if (errorMsg.includes("District admin not found") || errorMsg.includes("no active")) {
          throw new Error("No active district admin found for the selected district. Please contact the super admin instead.");
        }
        throw new Error(errorMsg);
      }

      setSuccessMessage(t("contact.form.success"));
      setForm({
        name: "",
        email: "",
        phone: "",
        memberRegNumber: "",
        topicKey: "membership",
        customTopic: "",
        message: "",
        targetType: "superadmin",
        selectedState: "",
        selectedStateName: "",
        selectedDistrict: "",
        selectedDistrictName: "",
        districtAdminId: "",
      });
    } catch (err) {
      console.error("Contact form submit failed", err);
      setErrorMessage(t("contact.form.error"));
    } finally {
      setSubmitting(false);
      // Reset button animation after a delay
      setTimeout(() => {
        setButtonClicked(false);
      }, 2000);
    }
  };

  // Filter district admins based on selected state and district
  const filteredDistrictAdmins = recipients?.districtAdmins.filter((admin) => {
    if (!form.selectedState && !form.selectedDistrict) return false;
    if (form.selectedState && admin.state) {
      const selectedStateName = states.find((s) => String(s.id) === form.selectedState)?.name;
      if (selectedStateName && admin.state !== selectedStateName) return false;
    }
    if (form.selectedDistrict && admin.district) {
      const selectedDistrictName = districts.find(
        (d) => d.id === form.selectedDistrict
      )?.name;
      if (selectedDistrictName && admin.district !== selectedDistrictName) return false;
    }
    return true;
  }) || [];

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-r from-orange-50 via-white to-orange-50 border-t border-orange-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 max-w-[1920px]">
        {/* Section Heading */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-orange-500 mb-2 sm:mb-3">
            {t("contact.form.badge")}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-orange-900 tracking-tight leading-tight">
            {t("contact.form.title")}
          </h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base md:text-lg text-orange-700/80 leading-relaxed max-w-3xl mx-auto">
            {t("contact.form.description")}
          </p>
        </div>

        {/* Form - Full Width */}
        <Card className="border-orange-100 shadow-lg shadow-orange-100/40 w-full">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-orange-900">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                <span className="leading-tight">{t("contact.form.cardTitle")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Basic info - 4 columns on md+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="leading-tight">{t("contact.form.nameLabel")}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder={t("contact.form.namePlaceholder")}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="leading-tight">{t("contact.form.emailLabel")}</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder={t("contact.form.emailPlaceholder")}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="leading-tight">{t("contact.form.phoneLabel")}</span>
                    </label>
                    <Input
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder={t("contact.form.phonePlaceholder")}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                      <Badge className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                      <span className="leading-tight">{t("contact.form.memberRegLabel")}</span>
                    </label>
                    <Input
                      value={form.memberRegNumber}
                      onChange={(e) =>
                        handleChange("memberRegNumber", e.target.value)
                      }
                      placeholder={t("contact.form.memberRegPlaceholder")}
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Topic - horizontal on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">
                      {t("contact.form.topicLabel")}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Select
                      value={form.topicKey}
                      onValueChange={(value) =>
                        handleChange("topicKey", value as TopicKey)
                      }
                    >
                      <SelectTrigger className="w-full text-sm sm:text-base h-9 sm:h-10">
                        <SelectValue placeholder={t("contact.form.topic.membership")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="membership">
                          {t("contact.form.topic.membership")}
                        </SelectItem>
                        <SelectItem value="certificate">
                          {t("contact.form.topic.certificate")}
                        </SelectItem>
                        <SelectItem value="email_issue">
                          {t("contact.form.topic.emailIssue")}
                        </SelectItem>
                        <SelectItem value="content_issue">
                          {t("contact.form.topic.contentIssue")}
                        </SelectItem>
                        <SelectItem value="technical">
                          {t("contact.form.topic.technical")}
                        </SelectItem>
                        <SelectItem value="store_issue">
                          {t("contact.form.topic.storeIssue")}
                        </SelectItem>
                        <SelectItem value="complaint">
                          {t("contact.form.topic.complaint")}
                        </SelectItem>
                        <SelectItem value="feedback">
                          {t("contact.form.topic.feedback")}
                        </SelectItem>
                        <SelectItem value="other">
                          {t("contact.form.topic.other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.topicKey === "other" && (
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">
                        {t("contact.form.customTopicLabel")}
                      </label>
                      <Input
                        value={form.customTopic}
                        onChange={(e) =>
                          handleChange("customTopic", e.target.value)
                        }
                        placeholder={t("contact.form.customTopicPlaceholder")}
                        className="text-sm sm:text-base"
                      />
                    </div>
                  )}
                </div>

                {/* Recipient selection - Compact */}
                <div className="space-y-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    {t("contact.form.recipientLabel")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border border-gray-200 p-2 bg-gray-50/60">
                    <label className="flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="targetType"
                        className="mt-0.5 h-3.5 w-3.5 text-orange-600 focus:ring-orange-500 flex-shrink-0"
                        value="superadmin"
                        checked={form.targetType === "superadmin"}
                        onChange={() => handleChange("targetType", "superadmin")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 leading-tight">
                          {t("contact.form.recipientSuperadmin")}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                          {t("contact.form.recipientSuperadminHint")}
                        </p>
                      </div>
                    </label>

                    <label className="flex flex-col gap-1.5 rounded-md border border-transparent px-2 py-1.5 hover:bg-white cursor-pointer transition-colors">
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="targetType"
                          className="mt-0.5 h-3.5 w-3.5 text-orange-600 focus:ring-orange-500 flex-shrink-0"
                          value="district_admin"
                          checked={form.targetType === "district_admin"}
                          onChange={() =>
                            handleChange("targetType", "district_admin")
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 leading-tight">
                            {t("contact.form.recipientDistrictAdmin")}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
                            {t("contact.form.recipientDistrictAdminHint")}
                          </p>
                        </div>
                      </div>
                      {form.targetType === "district_admin" && (
                        <div className="pl-5 space-y-1.5">
                          {/* State Selection */}
                          <Select
                            value={form.selectedState}
                            onValueChange={(value) => {
                              const stateName = states.find((s) => String(s.id) === value)?.name || "";
                              handleChange("selectedState", value);
                              handleChange("selectedStateName", stateName);
                              // Clear district when state changes
                              handleChange("selectedDistrict", "");
                              handleChange("selectedDistrictName", "");
                              handleChange("districtAdminId", "");
                              // Auto-switch to district_admin when state is selected
                              if (form.targetType !== "district_admin") {
                                handleChange("targetType", "district_admin");
                              }
                            }}
                            disabled={loadingStates}
                          >
                            <SelectTrigger className="w-full text-xs h-7">
                              <SelectValue
                                placeholder={
                                  loadingStates
                                    ? t("contact.form.loadingStates") || "Loading..."
                                    : t("contact.form.selectStatePlaceholder") ||
                                      "Select state"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.id} value={String(state.id)}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* District Selection */}
                          {form.selectedState && (
                            <Select
                              value={form.selectedDistrict ? String(form.selectedDistrict) : undefined}
                              onValueChange={(value) => {
                                const district = districts.find((d) => String(d.id) === String(value));
                                const districtName = district?.name || "";
                                
                                handleChange("selectedDistrict", String(value));
                                handleChange("selectedDistrictName", districtName);
                                
                                // Try to auto-select the district admin (API will also lookup by name as fallback)
                                if (districtName && recipients?.districtAdmins) {
                                  const admin = recipients.districtAdmins.find(
                                    (a) => a.district?.toLowerCase() === districtName.toLowerCase() &&
                                           a.state?.toLowerCase() === form.selectedStateName?.toLowerCase()
                                  );
                                  handleChange("districtAdminId", admin ? String(admin.id) : "");
                                } else {
                                  handleChange("districtAdminId", "");
                                }
                              }}
                              disabled={loadingDistricts || districts.length === 0}
                            >
                              <SelectTrigger className="w-full text-xs h-7">
                                <SelectValue
                                  placeholder={
                                    loadingDistricts
                                      ? t("contact.form.loadingDistricts") || "Loading..."
                                      : districts.length === 0
                                        ? t("contact.form.noDistricts") || "No districts"
                                        : t("contact.form.selectDistrictPlaceholder") || "Select district"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {districts.map((district) => (
                                  <SelectItem key={district.id} value={String(district.id)}>
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    {t("contact.form.messageLabel")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    rows={4}
                    placeholder={t("contact.form.messagePlaceholder")}
                    className="text-sm sm:text-base resize-y min-h-[120px]"
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t("contact.form.messageHint")}
                  </p>
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
                  <p className="text-xs text-gray-500 order-2 sm:order-1 max-w-full sm:max-w-xs">
                    {t("contact.form.disclaimer")}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`animated-send-button w-full sm:w-auto order-1 sm:order-2 ${buttonClicked ? 'button-clicked' : ''}`}
                  >
                    <div className="send-button-outline"></div>
                    <div className={`send-button-state state--default ${buttonClicked ? '' : 'active'}`}>
                      <div className="icon">
                        <svg
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g style={{ filter: "url(#shadow)" }}>
                            <path
                              d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                              fill="currentColor"
                            />
                            <path
                              d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                              fill="currentColor"
                            />
                          </g>
                          <defs>
                            <filter id="shadow">
                              <feDropShadow
                                dx="0"
                                dy="1"
                                stdDeviation="0.6"
                                floodOpacity="0.5"
                              />
                            </filter>
                          </defs>
                        </svg>
                      </div>
                      <p>
                        {submitting ? (
                          <>
                            {splitText(language === 'hi' ? 'भेजा जा रहा है...' : 'Sending...')}
                          </>
                        ) : (
                          <>
                            {splitText(sendMessageText)}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="send-button-state state--sent">
                      <div className="icon">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          height="1em"
                          width="1em"
                          strokeWidth="0.5px"
                          stroke="black"
                        >
                          <g style={{ filter: "url(#shadow)" }}>
                            <path
                              fill="currentColor"
                              d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                            />
                            <path
                              fill="currentColor"
                              d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                            />
                          </g>
                        </svg>
                      </div>
                      <p>
                        {splitText(sentText)}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Alerts */}
                {successMessage && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs sm:text-sm text-green-800">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-800">
                    {errorMessage}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
      </div>
    </section>
  );
}


