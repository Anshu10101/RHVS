"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Inbox,
  Trash2,
  RefreshCw,
  Search,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface RecipientsResponse {
  success: boolean;
  data?: {
    superadmins: {
      id: number;
      name: string;
      email: string;
    }[];
    districtAdmins: {
      id: number;
      name: string;
      email: string;
      district?: string | null;
      state?: string | null;
    }[];
  };
}

export function ContactInbox() {
  const { currentUser } = useAdmin();
  const { t } = useLanguage();
  const router = useRouter();

  const isSuperAdmin =
    currentUser?.type === "superadmin" || currentUser?.role === "superadmin";
  const isDistrictAdmin =
    currentUser?.type === "district_admin";

  const [activeTab, setActiveTab] = useState<"my" | "districts">("my");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"" | MessageStatus>("");
  const [search, setSearch] = useState("");
  const [recipients, setRecipients] =
    useState<RecipientsResponse["data"] | null>(null);
  const [selectedDistrictAdminId, setSelectedDistrictAdminId] = useState<
    string | null
  >(null);

  const [bulkSelection, setBulkSelection] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const canUseDistrictTab = isSuperAdmin;

  // Load district admins for superadmin tab switching
  useEffect(() => {
    if (!canUseDistrictTab) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/contact/recipients?_t=${Date.now()}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        const data = (await res.json()) as RecipientsResponse;
        if (data.success && data.data) {
          setRecipients(data.data);
        }
      } catch (err) {
        console.error("Failed to load recipients for inbox", err);
      }
    };

    load();
  }, [canUseDistrictTab]);

  const loadMessages = async (page = 1) => {
    if (!currentUser) return;
    setLoading(true);
    setBulkSelection([]);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (filterStatus) params.set("status", filterStatus);
      if (search.trim()) params.set("search", search.trim());

      if (canUseDistrictTab && activeTab === "districts" && selectedDistrictAdminId) {
        params.set("forType", "district_admin");
        params.set("forId", selectedDistrictAdminId);
      }

      const token = typeof window !== "undefined"
        ? localStorage.getItem("admin_token")
        : null;

      // Add cache-busting timestamp to prevent caching
      params.set("_t", String(Date.now()));

      const res = await fetch(`/api/admin/contact/messages?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed");
      }

      setMessages(data.data.messages || []);
      setPagination(data.data.pagination || null);
      
      // Dispatch event to notify header to refresh badge count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('inboxUpdated'));
      }
    } catch (err) {
      console.error("Failed to load contact messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterStatus, selectedDistrictAdminId, search, pageSize]);

  // Lightweight polling so new messages appear without full page reload
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      void loadMessages(pagination?.page || 1);
    }, 15000); // 15s

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadMessages(pagination?.page || 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, pagination?.page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadMessages(1);
  };

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

  const topicLabel = (topic: TopicKey, custom?: string | null) => {
    if (topic === "other" && custom) return custom;
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
    return t(keyMap[topic]);
  };

  const handleSelectMessage = (msg: ContactMessage) => {
    router.push(`/admin/contact/messages/${msg.id}`);
  };

  const toggleBulkSelection = (id: number) => {
    setBulkSelection((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allSelected = useMemo(
    () =>
      messages.length > 0 &&
      messages.every((m) => bulkSelection.includes(m.id)),
    [messages, bulkSelection]
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setBulkSelection([]);
    } else {
      setBulkSelection(messages.map((m) => m.id));
    }
  };

  const performBulkAction = async (action: "mark-read" | "mark-unread" | "delete") => {
    if (bulkSelection.length === 0) return;

    if (action === "delete") {
      const ok = window.confirm(t("admin.contact.inbox.confirmDelete"));
      if (!ok) return;
    }

    try {
      setUpdating(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("admin_token")
          : null;
      const res = await fetch("/api/admin/contact/messages", {
        method: "PATCH",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action, ids: bulkSelection }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || "Failed");
      }

      if (action === "delete") {
        // Force immediate reload with cache-busting after deletion
        // Small delay to ensure DB transaction is committed
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadMessages(pagination?.page || 1);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            bulkSelection.includes(m.id)
              ? {
                  ...m,
                  status: action === "mark-read" ? "read" : "unread",
                  read_at:
                    action === "mark-read" ? new Date().toISOString() : null,
                }
              : m
          )
        );
      }
      setBulkSelection([]);
      
      // Dispatch custom event to notify header to refresh badge count
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('inboxUpdated'));
      }
    } catch (err) {
      console.error("Bulk action failed", err);
      // Show error to user
      alert(err instanceof Error ? err.message : "Failed to perform action. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const currentAdminLabel = useMemo(() => {
    if (!currentUser) return "";
    if (activeTab === "my") {
      if (isSuperAdmin) return t("admin.contact.inbox.superadminInbox");
      if (isDistrictAdmin) return t("admin.contact.inbox.districtInbox");
    }
    if (activeTab === "districts" && selectedDistrictAdminId && recipients) {
      const admin = recipients.districtAdmins?.find(
        (a) => String(a.id) === selectedDistrictAdminId
      );
      if (admin) {
        return `${admin.name}${
          admin.district ? ` — ${admin.district}${admin.state ? `, ${admin.state}` : ""}` : ""
        }`;
      }
    }
    return "";
  }, [
    activeTab,
    currentUser,
    isSuperAdmin,
    isDistrictAdmin,
    selectedDistrictAdminId,
    recipients,
    t,
  ]);

  return (
    <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
      <div className="flex flex-col gap-1 sm:gap-2 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            {t("admin.contact.inbox.title")}
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs text-gray-600 hidden sm:block">
            {t("admin.contact.inbox.subtitle")}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border border-gray-200 shadow-sm flex flex-col sm:h-[calc(100vh-140px)]">
        <CardHeader className="border-b border-gray-200 py-2 sm:py-3 px-3 sm:px-4 flex flex-col gap-2 sm:gap-3 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Tabs
                value={activeTab}
                onValueChange={(val) => {
                  const newTab = val as "my" | "districts";
                  setActiveTab(newTab);
                  // Clear district admin selection when switching away from districts tab
                  if (newTab === "my" && selectedDistrictAdminId) {
                    setSelectedDistrictAdminId(null);
                  }
                }}
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="my" className="flex-1 sm:flex-none">
                    {t("admin.contact.inbox.tabMy")}
                  </TabsTrigger>
                  {canUseDistrictTab && (
                    <TabsTrigger value="districts" className="flex-1 sm:flex-none">
                      {t("admin.contact.inbox.tabDistricts")}
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
              {currentAdminLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 sm:px-3 py-1 text-xs text-gray-700 truncate max-w-full">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{currentAdminLabel}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadMessages(pagination?.page || 1)}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw
                  className={`h-4 w-4 sm:mr-1 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">{t("admin.contact.inbox.refresh")}</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col sm:flex-1 sm:min-h-0">
          {canUseDistrictTab && activeTab === "districts" && (
            <div className="border-b border-gray-100 px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 bg-gray-50/60">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 shrink-0" />
                <span className="font-medium">{t("admin.contact.inbox.selectDistrictAdmin")}</span>
              </div>
              <div className="w-full flex items-center gap-2">
                <Select
                  value={selectedDistrictAdminId || ""}
                  onValueChange={(val) => {
                    const value = val || null;
                    setSelectedDistrictAdminId(value);
                    // Reset to page 1 when changing district admin
                    void loadMessages(1);
                  }}
                  disabled={loading || !recipients?.districtAdmins || recipients.districtAdmins.length === 0}
                >
                  <SelectTrigger className="flex-1 text-xs sm:text-sm h-9">
                    <SelectValue placeholder={
                      loading
                        ? t("admin.contact.inbox.loading") || "Loading..."
                        : !recipients?.districtAdmins || recipients.districtAdmins.length === 0
                        ? t("admin.contact.inbox.noDistrictAdmins") || "No district admins available"
                        : t("admin.contact.inbox.selectDistrictAdminPlaceholder")
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients?.districtAdmins?.map((admin) => (
                      <SelectItem key={admin.id} value={String(admin.id)}>
                        {admin.name}
                        {admin.district
                          ? ` — ${admin.district}${
                              admin.state ? `, ${admin.state}` : ""
                            }`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDistrictAdminId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDistrictAdminId(null);
                      void loadMessages(1);
                    }}
                    className="h-9 sm:h-9 px-2 sm:px-2 text-gray-500 hover:text-gray-700 shrink-0"
                    disabled={loading}
                    title={t("admin.contact.inbox.clearFilter") || "Clear filter"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="border-b border-gray-100 px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3 bg-white">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                onClick={toggleSelectAll}
                disabled={messages.length === 0}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                />
                <span className="text-xs">
                  {t("admin.contact.inbox.select")}
                </span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => performBulkAction("mark-read")}
                disabled={bulkSelection.length === 0 || updating}
                className="text-xs sm:text-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1 text-green-600" />
                <span className="hidden sm:inline">{t("admin.contact.inbox.markRead")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => performBulkAction("mark-unread")}
                disabled={bulkSelection.length === 0 || updating}
                className="text-xs sm:text-sm"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.contact.inbox.markUnread")}</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => performBulkAction("delete")}
                disabled={bulkSelection.length === 0 || updating}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.contact.inbox.delete")}</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Select
                value={filterStatus || "all"}
                onValueChange={(val) =>
                  setFilterStatus((val === "all" ? "" : val) as "" | MessageStatus)
                }
              >
                <SelectTrigger className="flex-1 sm:flex-none text-xs h-9">
                  <SelectValue placeholder={t("admin.contact.inbox.filterAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.contact.inbox.filterAll")}</SelectItem>
                  <SelectItem value="unread">
                    {t("admin.contact.inbox.filterUnread")}
                  </SelectItem>
                  <SelectItem value="read">
                    {t("admin.contact.inbox.filterRead")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 sm:flex-none sm:w-full sm:max-w-xs"
              >
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-7 sm:pl-8 pr-3 py-2 h-9 text-xs sm:text-sm"
                  placeholder={t("admin.contact.inbox.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </form>
            </div>
          </div>

          <div className="flex-1 flex flex-col sm:min-h-0">
            {/* List */}
            <div className="sm:flex-1 sm:overflow-y-auto border border-gray-100 rounded-b-lg sm:min-h-0">
              {loading ? (
                <div className="flex h-full items-center justify-center text-gray-500 text-sm">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {t("admin.contact.inbox.loading")}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 text-sm flex-col gap-2">
                  <Inbox className="h-8 w-8 text-gray-300" />
                  <span>{t("admin.contact.inbox.empty")}</span>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {messages.map((msg) => {
                    const isChecked = bulkSelection.includes(msg.id);
                    const isUnread = msg.status === "unread";

                    return (
                      <li
                        key={msg.id}
                        className={`flex items-stretch cursor-pointer transition-colors relative touch-manipulation ${
                          isUnread
                            ? "bg-blue-50/30 hover:bg-blue-50/50 border-l-4 border-l-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleSelectMessage(msg)}
                      >
                        <div className="flex items-center px-2 sm:px-3 py-2 sm:py-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleBulkSelection(msg.id)}
                            className="h-4 w-4 sm:h-4 sm:w-4 border-gray-300 text-orange-600"
                          />
                        </div>
                        <div className="flex-1 py-2 sm:py-3 pr-2 sm:pr-3 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                              )}
                              <span
                                className={`text-xs sm:text-sm truncate ${
                                  isUnread
                                    ? "font-semibold text-gray-900"
                                    : "font-medium text-gray-700"
                                }`}
                              >
                                {msg.sender_name}
                              </span>
                              {msg.sender_member_reg_number && (
                                <span
                                  className={`text-[10px] sm:text-[11px] rounded-full px-1.5 sm:px-2 py-0.5 shrink-0 ${
                                    isUnread
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {msg.sender_member_reg_number}
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] sm:text-xs whitespace-nowrap shrink-0 ${
                                isUnread ? "text-gray-600 font-medium" : "text-gray-400"
                              }`}
                            >
                              {formatDateIST(msg.created_at)}
                            </span>
                          </div>
                          <div className="mt-1 sm:mt-0.5 flex items-center gap-1.5 sm:gap-2 text-xs">
                            <span
                              className={`inline-flex items-center rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] border ${
                                isUnread
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-orange-50 text-orange-700 border-orange-100"
                              }`}
                            >
                              {topicLabel(msg.topic_key, msg.custom_topic)}
                            </span>
                          </div>
                          <div
                            className={`mt-0.5 text-[10px] sm:text-[11px] truncate ${
                              isUnread ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {msg.sender_email}
                            {msg.sender_phone
                              ? ` • ${msg.sender_phone}`
                              : ""}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Pagination */}
            {pagination && messages.length > 0 && (
              <div className="border-t border-gray-100 px-3 sm:px-4 py-2 flex flex-col gap-2 text-xs text-gray-600 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-center sm:text-left">
                    {t("admin.contact.inbox.pagination")
                      .replace("{{total}}", String(pagination.total))
                      .replace("{{page}}", String(pagination.page))
                      .replace("{{totalPages}}", String(pagination.totalPages))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        void loadMessages(1);
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-[120px] text-xs h-7 sm:h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 per page</SelectItem>
                        <SelectItem value="20">20 per page</SelectItem>
                        <SelectItem value="50">50 per page</SelectItem>
                        <SelectItem value="100">100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev || loading}
                    onClick={() => loadMessages(1)}
                    className="text-xs px-2 sm:px-3 py-1.5 h-7 sm:h-8"
                    title="First page"
                  >
                    ««
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev || loading}
                    onClick={() => loadMessages(pagination.page - 1)}
                    className="text-xs px-2 sm:px-3 py-1.5 h-7 sm:h-8"
                  >
                    {t("admin.contact.inbox.prev")}
                  </Button>
                  
                  {/* Page Numbers */}
                  {pagination.totalPages > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => loadMessages(pageNum)}
                            disabled={loading}
                            className={`text-xs px-2 sm:px-3 py-1.5 h-7 sm:h-8 min-w-[32px] ${
                              pagination.page === pageNum ? "bg-orange-600 text-white" : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext || loading}
                    onClick={() => loadMessages(pagination.page + 1)}
                    className="text-xs px-2 sm:px-3 py-1.5 h-7 sm:h-8"
                  >
                    {t("admin.contact.inbox.next")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext || loading}
                    onClick={() => loadMessages(pagination.totalPages)}
                    className="text-xs px-2 sm:px-3 py-1.5 h-7 sm:h-8"
                    title="Last page"
                  >
                    »»
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


