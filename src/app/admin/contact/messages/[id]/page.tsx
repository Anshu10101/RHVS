"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

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

type MessageStatus = "unread" | "read";

interface ContactMessage {
  id: number;
  member_id: number | null;
  sender_name: string;
  sender_email: string;
  sender_phone: string | null;
  sender_member_reg_number: string | null;
  topic_key: TopicKey;
  custom_topic: string | null;
  message: string;
  target_type: "superadmin" | "district_admin";
  superadmin_id: number | null;
  district_admin_id: number | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
  read_at: string | null;
}

const formatDateIST = (dateString: string): string => {
  const date = new Date(dateString);
  // Convert to IST (Asia/Kolkata timezone)
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  
  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === "day")?.value || "00";
  const month = parts.find((p) => p.type === "month")?.value || "00";
  const year = parts.find((p) => p.type === "year")?.value || "0000";
  const hour = parts.find((p) => p.type === "hour")?.value || "00";
  const minute = parts.find((p) => p.type === "minute")?.value || "00";
  const second = parts.find((p) => p.type === "second")?.value || "00";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "AM";
  
  return `${day}/${month}/${year}, ${hour}:${minute}:${second} ${dayPeriod.toUpperCase()}`;
};

function topicLabel(
  key: TopicKey,
  custom: string | null,
  t: (key: string) => string
): string {
  if (key === "other" && custom) return custom;
  const keyMap: Record<TopicKey, string> = {
    membership: "contact.form.topic.membership",
    certificate: "contact.form.topic.certificate",
    email_issue: "contact.form.topic.emailIssue",
    content_issue: "contact.form.topic.contentIssue",
    technical: "contact.form.topic.technical",
    store_issue: "contact.form.topic.storeIssue",
    complaint: "contact.form.topic.complaint",
    feedback: "contact.form.topic.feedback",
    other: "contact.form.topic.other",
  };
  return t(keyMap[key]);
}

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAdmin();
  const { t } = useLanguage();
  const messageId = params.id as string;

  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!currentUser || !messageId) return;

    const loadMessage = async () => {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("admin_token")
            : null;

        const res = await fetch(`/api/admin/contact/messages?page=1&limit=100`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();
        if (res.ok && data.success && data.data.messages) {
          const found = data.data.messages.find(
            (m: ContactMessage) => m.id === Number(messageId)
          );
          if (found) {
            setMessage(found);

            // Mark as read if unread
            if (found.status === "unread") {
              try {
                await fetch("/api/admin/contact/messages", {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({
                    action: "mark-read",
                    ids: [found.id],
                  }),
                });
                setMessage((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: "read",
                        read_at: new Date().toISOString(),
                      }
                    : null
                );
              } catch (err) {
                console.error("Failed to mark message as read", err);
              }
            }
          } else {
            router.push("/admin/contact/inbox");
          }
        } else {
          router.push("/admin/contact/inbox");
        }
      } catch (err) {
        console.error("Failed to load message", err);
        router.push("/admin/contact/inbox");
      } finally {
        setLoading(false);
      }
    };

    loadMessage();
  }, [currentUser, messageId, router]);

  const handleAction = async (action: "mark-read" | "mark-unread" | "delete") => {
    if (!message) return;

    try {
      setUpdating(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;

      const res = await fetch("/api/admin/contact/messages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          action,
          ids: [message.id],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `Failed to ${action} message`);
      }

      if (action === "delete") {
        // Dispatch event before navigation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inboxUpdated'));
        }
        router.push("/admin/contact/inbox");
      } else {
        setMessage((prev) =>
          prev
            ? {
                ...prev,
                status: action === "mark-read" ? "read" : "unread",
                read_at:
                  action === "mark-read"
                    ? new Date().toISOString()
                    : prev.read_at,
              }
            : null
        );
        // Dispatch event to notify header
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inboxUpdated'));
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} message`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} message. Please try again.`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>{t("admin.contact.inbox.loading")}</span>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Message not found</p>
          <Button onClick={() => router.push("/admin/contact/inbox")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/contact/inbox")}
          className="mb-3 sm:mb-4 text-xs sm:text-sm"
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {t("admin.contact.inbox.back") || "Back to Inbox"}
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 border-b border-gray-200 pb-3 sm:pb-4">
          <div className="flex-1 min-w-0">
            <div className="mb-2 sm:mb-3">
              <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Subject
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 break-words">
                  {topicLabel(message.topic_key, message.custom_topic, t)}
                </h1>
                {message.status === "unread" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] sm:text-xs text-orange-700 border border-orange-100 shrink-0">
                    <Mail className="h-3 w-3" />
                    {t("admin.contact.inbox.badgeUnread")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] sm:text-xs text-green-700 border border-green-100 shrink-0">
                    <CheckCircle2 className="h-3 w-3" />
                    {t("admin.contact.inbox.badgeRead")}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              {formatDateIST(message.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleAction(
                  message.status === "unread" ? "mark-read" : "mark-unread"
                )
              }
              disabled={updating}
              className="text-xs sm:text-sm flex-1 sm:flex-none"
            >
              {message.status === "unread" ? (
                <>
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 text-green-600" />
                  <span className="hidden sm:inline">{t("admin.contact.inbox.markRead")}</span>
                </>
              ) : (
                <>
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("admin.contact.inbox.markUnread")}</span>
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleAction("delete")}
              disabled={updating}
              className="text-xs sm:text-sm"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("admin.contact.inbox.delete")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Sender Info */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-semibold text-sm sm:text-base text-gray-900">
            {message.sender_name}
          </span>
          {message.sender_member_reg_number && (
            <span className="rounded-full bg-white px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs text-gray-600 border border-gray-200">
              {t("admin.contact.inbox.memberRegShort")}:{" "}
              {message.sender_member_reg_number}
            </span>
          )}
        </div>
        <div className="text-xs sm:text-sm text-gray-600 break-all">
          {message.sender_email}
          {message.sender_phone ? ` • ${message.sender_phone}` : ""}
        </div>
      </div>

      {/* Message Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
          {message.message}
        </div>
      </div>
    </div>
  );
}

