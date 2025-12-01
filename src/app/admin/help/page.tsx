"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home,
  Users,
  Shield,
  FileText,
  Building2,
  Award,
  BarChart3,
  Activity,
  Settings,
  Camera,
  Store,
  Calendar,
  Globe,
  Phone,
  UserPlus,
  UserCheck,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  Image as ImageIcon,
  Mail,
  MapPin,
  Search,
  Filter,
  Edit,
  Trash2,
  Upload,
  Download,
  Eye,
  X,
  Menu,
  User,
  LogOut,
} from 'lucide-react';

export default function AdminHelpPage() {
  const { currentUser } = useAdmin();
  const { t } = useLanguage();
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isSuperAdmin = currentUser?.type === 'superadmin';
  const isDistrictAdmin = currentUser?.type === 'district_admin';

  const sections = [
    {
      id: 'getting-started',
      title: t('admin.help.sections.gettingStarted'),
      icon: Home,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              {t('admin.help.gettingStarted.welcome')}
            </h4>
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.gettingStarted.welcomeDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {t('admin.help.gettingStarted.step1')}
            </h4>
            <p className="text-gray-700 mb-2 text-xs sm:text-sm ml-4 sm:ml-6 leading-relaxed">{t('admin.help.gettingStarted.step1Desc')}</p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {t('admin.help.gettingStarted.step2')}
            </h4>
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-orange-100 p-1.5 sm:p-2 rounded flex-shrink-0">
                  <Menu className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{t('admin.help.gettingStarted.sidebar')}</p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{t('admin.help.gettingStarted.sidebarDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded flex-shrink-0">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{t('admin.help.gettingStarted.header')}</p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{t('admin.help.gettingStarted.headerDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-green-100 p-1.5 sm:p-2 rounded flex-shrink-0">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs sm:text-sm">{t('admin.help.gettingStarted.content')}</p>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{t('admin.help.gettingStarted.contentDesc')}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {t('admin.help.gettingStarted.step3')}
            </h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li><strong>{t('admin.help.general.click')}</strong> {t('admin.help.gettingStarted.navTip1')}</li>
              <li>{t('admin.help.gettingStarted.navTip2')}</li>
              <li>{t('admin.help.gettingStarted.navTip3')}</li>
              <li>{t('admin.help.gettingStarted.navTip4')}</li>
              <li>{t('admin.help.gettingStarted.navTip5')}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: t('admin.help.sections.dashboard'),
      icon: BarChart3,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.dashboard.whatIs')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.dashboard.whatIsDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.dashboard.whatYouSee')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li><strong>{t('admin.help.dashboard.quickStats')}</strong></li>
              <li><strong>{t('admin.help.dashboard.sectionCards')}</strong></li>
              <li><strong>{t('admin.help.dashboard.roleBadge')}</strong></li>
              <li><strong>{t('admin.help.dashboard.welcomeMsg')}</strong></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.dashboard.howToUse')}</h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.dashboard.useStep1')}</li>
              <li>{t('admin.help.dashboard.useStep2')}</li>
              <li>{t('admin.help.dashboard.useStep3')}</li>
              <li>{t('admin.help.dashboard.useStep4')}</li>
            </ol>
          </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 rounded">
              <p className="text-yellow-800 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.dashboard.tip')}
              </p>
            </div>
        </div>
      ),
    },
    {
      id: 'members',
      title: t('admin.help.sections.members'),
      icon: Users,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.members.whatIs')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.members.whatIsDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              {t('admin.help.members.viewAllTitle')}
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.members.viewAllStep1')}</li>
              <li>{t('admin.help.members.viewAllStep2')}</li>
              <li>{t('admin.help.members.viewAllStep3')}</li>
              <li>{t('admin.help.members.viewAllStep4')}</li>
              <li>{t('admin.help.members.viewAllStep5')}</li>
              <li>{t('admin.help.members.viewAllStep6')}</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {t('admin.help.members.addNewTitle')}
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.members.addNewStep1')}</li>
              <li>{t('admin.help.members.addNewStep2')}</li>
              <li>{t('admin.help.members.addNewStep3')}
                <ul className="list-disc list-inside ml-3 sm:ml-6 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                  <li>{t('admin.help.members.addNewInfo1')}</li>
                  <li>{t('admin.help.members.addNewInfo2')}</li>
                  <li>{t('admin.help.members.addNewInfo3')}</li>
                  <li>{t('admin.help.members.addNewInfo4')}</li>
                  <li>{t('admin.help.members.addNewInfo5')}</li>
                  <li>{t('admin.help.members.addNewInfo6')}</li>
                  <li>{t('admin.help.members.addNewInfo7')}</li>
                  <li>{t('admin.help.members.addNewInfo8')}</li>
                  <li>{t('admin.help.members.addNewInfo9')}</li>
                  <li>{t('admin.help.members.addNewInfo10')}</li>
                </ul>
              </li>
              <li>{t('admin.help.members.addNewStep4')}</li>
              <li>{t('admin.help.members.addNewStep5')}</li>
              <li>{t('admin.help.members.addNewStep6')}</li>
              <li>{t('admin.help.members.addNewStep7')}</li>
              <li>{t('admin.help.members.addNewStep8')}</li>
            </ol>
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded mt-2 sm:mt-3">
              <p className="text-red-800 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.members.important')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              {t('admin.help.members.tokenVerificationTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.members.tokenVerificationDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.members.tokenVerificationStep1')}</li>
              <li>{t('admin.help.members.tokenVerificationStep2')}</li>
              <li>{t('admin.help.members.tokenVerificationStep3')}</li>
              <li>{t('admin.help.members.tokenVerificationStep4')}</li>
              <li>{t('admin.help.members.tokenVerificationStep5')}</li>
              <li>{t('admin.help.members.tokenVerificationStep6')}</li>
            </ol>
          </div>

          {isSuperAdmin && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                {t('admin.help.members.districtAdminsTitle')}
              </h4>
              <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.members.districtAdminsDesc')}
              </p>
              <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                <li>{t('admin.help.members.districtAdminsStep1')}</li>
                <li>{t('admin.help.members.districtAdminsStep2')}</li>
                <li>{t('admin.help.members.districtAdminsStep3')}</li>
                <li>{t('admin.help.members.districtAdminsStep4')}</li>
                <li>{t('admin.help.members.districtAdminsStep5')}</li>
                <li>{t('admin.help.members.districtAdminsStep6')}</li>
                <li>{t('admin.help.members.districtAdminsStep7')}</li>
              </ol>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded">
            <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.members.searchTip')}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'permissions',
      title: t('admin.help.sections.permissions'),
      icon: Shield,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {isSuperAdmin ? (
            <>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.permissions.whatAre')}</h4>
                <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  {t('admin.help.permissions.whatAreDesc')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  {t('admin.help.permissions.assignTitle')}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.permissions.assignStep1')}</li>
                  <li>{t('admin.help.permissions.assignStep2')}</li>
                  <li>{t('admin.help.permissions.assignStep3')}</li>
                  <li>{t('admin.help.permissions.assignStep4')}
                    <ul className="list-disc list-inside ml-3 sm:ml-6 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                      <li><strong>{t('admin.help.permissions.viewMembers')}</strong></li>
                      <li><strong>{t('admin.help.permissions.addMembers')}</strong></li>
                      <li><strong>{t('admin.help.permissions.manageGallery')}</strong></li>
                      <li><strong>{t('admin.help.permissions.editAbout')}</strong></li>
                      <li><strong>{t('admin.help.permissions.manageHeroImages')}</strong></li>
                      <li><strong>{t('admin.help.permissions.addProducts')}</strong></li>
                      <li><strong>{t('admin.help.permissions.editNewsEvents')}</strong></li>
                      <li><strong>{t('admin.help.permissions.viewAnalytics')}</strong></li>
                      <li>{t('admin.help.permissions.andMore')}</li>
                    </ul>
                  </li>
                  <li>{t('admin.help.permissions.assignStep5')}</li>
                  <li>{t('admin.help.permissions.assignStep6')}</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  {t('admin.help.permissions.historyTitle')}
                </h4>
                <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
                  {t('admin.help.permissions.historyDesc')}
                </p>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.permissions.historyStep1')}</li>
                  <li>{t('admin.help.permissions.historyStep2')}</li>
                  <li>{t('admin.help.permissions.historyStep3')}</li>
                  <li>{t('admin.help.permissions.historyStep4')}</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.permissions.onlySuperAdmin')}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'content',
      title: t('admin.help.sections.content'),
      icon: FileText,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.content.whatIs')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.whatIsDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              {t('admin.help.content.aboutTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.aboutDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.content.aboutStep1')}</li>
              <li>{t('admin.help.content.aboutStep2')}</li>
              <li>{t('admin.help.content.aboutStep3')}</li>
              <li>{t('admin.help.content.aboutStep4')}</li>
              <li>{t('admin.help.content.aboutStep5')}</li>
              <li>{t('admin.help.content.aboutStep6')}</li>
              <li>{t('admin.help.content.aboutStep7')}</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              {t('admin.help.content.heroImagesTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.heroImagesDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.content.heroImagesStep1')}</li>
              <li>{t('admin.help.content.heroImagesStep2')}</li>
              <li>{t('admin.help.content.heroImagesStep3')}</li>
              <li>{t('admin.help.content.heroImagesStep4')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.heroImagesStep4a')}</li>
                  <li>{t('admin.help.content.heroImagesStep4b')}</li>
                  <li>{t('admin.help.content.heroImagesStep4c')}</li>
                  <li>{t('admin.help.content.heroImagesStep4d')}</li>
                </ul>
              </li>
              <li>{t('admin.help.content.heroImagesStep5')}</li>
              <li>{t('admin.help.content.heroImagesStep6')}</li>
            </ol>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 rounded mt-2 sm:mt-3">
              <p className="text-yellow-800 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.content.heroImagesTip')}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              {t('admin.help.content.photoManagementTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.photoManagementDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.content.photoManagementStep1')}</li>
              <li>{t('admin.help.content.photoManagementStep2')}</li>
              <li>{t('admin.help.content.photoManagementStep3')}</li>
              <li>{t('admin.help.content.photoManagementStep4')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.photoManagementStep4a')}</li>
                  <li>{t('admin.help.content.photoManagementStep4b')}</li>
                  <li>{t('admin.help.content.photoManagementStep4c')}</li>
                  <li>{t('admin.help.content.photoManagementStep4d')}</li>
                  <li>{t('admin.help.content.photoManagementStep4e')}</li>
                </ul>
              </li>
              <li>{t('admin.help.content.photoManagementStep5')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.photoManagementStep5a')}</li>
                  <li>{t('admin.help.content.photoManagementStep5b')}</li>
                  <li>{t('admin.help.content.photoManagementStep5c')}</li>
                </ul>
              </li>
              <li>{t('admin.help.content.photoManagementStep6')}</li>
              <li>{t('admin.help.content.photoManagementStep7')}</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
              {t('admin.help.content.productStoreTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.productStoreDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.content.productStoreStep1')}</li>
              <li>{t('admin.help.content.productStoreStep2')}</li>
              <li>{t('admin.help.content.productStoreStep3')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.productStoreStep3a')}</li>
                  <li>{t('admin.help.content.productStoreStep3b')}</li>
                  <li>{t('admin.help.content.productStoreStep3c')}</li>
                  <li>{t('admin.help.content.productStoreStep3d')}</li>
                  <li>{t('admin.help.content.productStoreStep3e')}</li>
                  <li>{t('admin.help.content.productStoreStep3f')}</li>
                  <li>{t('admin.help.content.productStoreStep3g')}</li>
                  <li>{t('admin.help.content.productStoreStep3h')}</li>
                </ul>
              </li>
              <li>{t('admin.help.content.productStoreStep4')}</li>
              <li>{t('admin.help.content.productStoreStep5')}</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
              {t('admin.help.content.newsEventsTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.content.newsEventsDesc')}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.content.newsEventsStep1')}</li>
              <li>{t('admin.help.content.newsEventsStep2')}</li>
              <li>{t('admin.help.content.newsEventsStep3')}</li>
              <li>{t('admin.help.content.newsEventsStep4')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.newsEventsStep4a')}</li>
                  <li>{t('admin.help.content.newsEventsStep4b')}</li>
                  <li>{t('admin.help.content.newsEventsStep4c')}</li>
                  <li>{t('admin.help.content.newsEventsStep4d')}</li>
                  <li>{t('admin.help.content.newsEventsStep4e')}</li>
                  <li>{t('admin.help.content.newsEventsStep4f')}</li>
                </ul>
              </li>
              <li>{t('admin.help.content.newsEventsStep5')}:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>{t('admin.help.content.newsEventsStep5a')}</li>
                  <li>{t('admin.help.content.newsEventsStep5b')}</li>
                  <li>{t('admin.help.content.newsEventsStep5c')}</li>
                  <li>{t('admin.help.content.newsEventsStep5d')}</li>
                  <li>{t('admin.help.content.newsEventsStep5e')}</li>
                  <li>{t('admin.help.content.newsEventsStep5f')}</li>
                  <li>{t('admin.help.content.newsEventsStep5g')}</li>
                </ul>
              </li>
            </ol>
          </div>

          {isSuperAdmin && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 flex-shrink-0" />
                {t('admin.help.content.contactTitle')}
              </h4>
              <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.content.contactDesc')}
              </p>
              <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                <li>{t('admin.help.content.contactStep1')}</li>
                <li>{t('admin.help.content.contactStep2')}</li>
                <li>{t('admin.help.content.contactStep3')}</li>
                <li>{t('admin.help.content.contactStep4')}</li>
              </ol>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'departments',
      title: t('admin.help.sections.departments'),
      icon: Building2,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.departments.whatAre')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.departments.whatAreDesc')}
            </p>
          </div>

          {isSuperAdmin && (
            <>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  {t('admin.help.departments.createTitle')}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.departments.createStep1')}</li>
                  <li>{t('admin.help.departments.createStep2')}</li>
                  <li>{t('admin.help.departments.createStep3')}</li>
                  <li>{t('admin.help.departments.createStep4')}</li>
                  <li>{t('admin.help.departments.createStep5')}</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  {t('admin.help.departments.manageTitle')}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.departments.manageStep1')}</li>
                  <li>{t('admin.help.departments.manageStep2')}</li>
                  <li>{t('admin.help.departments.manageStep3')}</li>
                  <li>{t('admin.help.departments.manageStep4')}</li>
                  <li>{t('admin.help.departments.manageStep5')}</li>
                </ol>
              </div>
            </>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
              {t('admin.help.departments.assignTitle')}
            </h4>
            <p className="text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">
              {isSuperAdmin 
                ? t('admin.help.departments.assignDescSuper')
                : t('admin.help.departments.assignDescDistrict')
              }
            </p>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.departments.assignStep1')}</li>
              <li>{t('admin.help.departments.assignStep2')}</li>
              <li>{t('admin.help.departments.assignStep3')}</li>
              <li>{t('admin.help.departments.assignStep4')}</li>
              <li>{t('admin.help.departments.assignStep5')}</li>
              <li>{t('admin.help.departments.assignStep6')}</li>
              <li>{t('admin.help.departments.assignStep7')}</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'certificates',
      title: t('admin.help.sections.certificates'),
      icon: Award,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {isSuperAdmin ? (
            <>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.certificates.whatAre')}</h4>
                <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  {t('admin.help.certificates.whatAreDesc')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  {t('admin.help.certificates.addSignTitle')}
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.certificates.addSignStep1')}</li>
                  <li>{t('admin.help.certificates.addSignStep2')}</li>
                  <li>{t('admin.help.certificates.addSignStep3')}</li>
                  <li>{t('admin.help.certificates.addSignStep4')}</li>
                  <li>{t('admin.help.certificates.addSignStep5')}</li>
                  <li>{t('admin.help.certificates.addSignStep6')}</li>
                  <li>{t('admin.help.certificates.addSignStep7')}</li>
                </ol>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 rounded mt-2 sm:mt-3">
                  <p className="text-yellow-800 text-xs sm:text-sm leading-relaxed">
                    {t('admin.help.certificates.signTip')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.general.onlySuperAdmin')}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'analytics',
      title: t('admin.help.sections.analytics'),
      icon: BarChart3,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.analytics.whatIs')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.analytics.whatIsDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.analytics.whatYouSee')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li><strong>{t('admin.help.analytics.memberStats')}</strong></li>
              <li><strong>{t('admin.help.analytics.activityCharts')}</strong></li>
              <li><strong>{t('admin.help.analytics.districtData')}</strong></li>
              <li><strong>{t('admin.help.analytics.registrationTrends')}</strong></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.analytics.howToUse')}</h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.analytics.useStep1')}</li>
              <li>{t('admin.help.analytics.useStep2')}</li>
              <li>{t('admin.help.analytics.useStep3')}</li>
              <li>{t('admin.help.analytics.useStep4')}</li>
            </ol>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800 text-sm">
              {t('admin.help.analytics.tip')}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'activity-logs',
      title: t('admin.help.sections.activityLogs'),
      icon: Activity,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {isSuperAdmin ? (
            <>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.activityLogs.whatAre')}</h4>
                <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  {t('admin.help.activityLogs.whatAreDesc')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.activityLogs.whatYouSee')}</h4>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.activityLogs.whoLoggedIn')}</li>
                  <li>{t('admin.help.activityLogs.memberChanges')}</li>
                  <li>{t('admin.help.activityLogs.contentChanges')}</li>
                  <li>{t('admin.help.activityLogs.permissionChanges')}</li>
                  <li>{t('admin.help.activityLogs.muchMore')}</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.activityLogs.howToUse')}</h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.activityLogs.useStep1')}</li>
                  <li>{t('admin.help.activityLogs.useStep2')}</li>
                  <li>{t('admin.help.activityLogs.useStep3')}:
                    <ul className="list-disc list-inside ml-3 sm:ml-6 mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                      <li>{t('admin.help.activityLogs.useStep3a')}</li>
                      <li>{t('admin.help.activityLogs.useStep3b')}</li>
                      <li>{t('admin.help.activityLogs.useStep3c')}</li>
                    </ul>
                  </li>
                  <li>{t('admin.help.activityLogs.useStep4')}</li>
                </ol>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.general.onlySuperAdmin')}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'settings',
      title: t('admin.help.sections.settings'),
      icon: Settings,
      content: (
        <div className="space-y-3 sm:space-y-4">
          {isSuperAdmin ? (
            <>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.settings.whatAre')}</h4>
                <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                  {t('admin.help.settings.whatAreDesc')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.settings.available')}</h4>
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li><strong>{t('admin.help.settings.general')}</strong></li>
                  <li><strong>{t('admin.help.settings.security')}</strong></li>
                  <li><strong>{t('admin.help.settings.email')}</strong></li>
                  <li><strong>{t('admin.help.settings.appearance')}</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.settings.howToUse')}</h4>
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
                  <li>{t('admin.help.settings.useStep1')}</li>
                  <li>{t('admin.help.settings.useStep2')}</li>
                  <li>{t('admin.help.settings.useStep3')}</li>
                  <li>{t('admin.help.settings.useStep4')}</li>
                </ol>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-800 text-sm">
                  {t('admin.help.settings.warning')}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.general.onlySuperAdmin')}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'profile',
      title: t('admin.help.sections.profile'),
      icon: User,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.profile.managing')}</h4>
            <p className="text-gray-700 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
              {t('admin.help.profile.managingDesc')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.profile.howToAccess')}</h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.profile.accessStep1')}</li>
              <li>{t('admin.help.profile.accessStep2')}</li>
              <li>{t('admin.help.profile.accessStep3')}</li>
              <li>{t('admin.help.profile.accessStep4')}</li>
              <li>{t('admin.help.profile.accessStep5')}</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.profile.whatYouCanDo')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.profile.viewInfo')}</li>
              <li>{t('admin.help.profile.updatePhoto')}</li>
              <li>{t('admin.help.profile.changePassword')}</li>
              <li>{t('admin.help.profile.updateContact')}</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.profile.changingPassword')}</h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.profile.passwordStep1')}</li>
              <li>{t('admin.help.profile.passwordStep2')}</li>
              <li>{t('admin.help.profile.passwordStep3')}</li>
              <li>{t('admin.help.profile.passwordStep4')}</li>
              <li>{t('admin.help.profile.passwordStep5')}</li>
              <li>{t('admin.help.profile.passwordStep6')}</li>
            </ol>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 sm:p-4 rounded mt-2 sm:mt-3">
              <p className="text-yellow-800 text-xs sm:text-sm leading-relaxed">
                {t('admin.help.profile.passwordTip')}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'logout',
      title: t('admin.help.sections.logout'),
      icon: LogOut,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.logout.howTo')}</h4>
            <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.logout.step1')}</li>
              <li>{t('admin.help.logout.step2')}</li>
              <li>{t('admin.help.logout.step3')}</li>
              <li>{t('admin.help.logout.step4')}</li>
            </ol>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-blue-800 text-sm">
              {t('admin.help.logout.tip')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.logout.alternative')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.logout.sidebar')}</li>
              <li>{t('admin.help.logout.browser')}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'tips-troubleshooting',
      title: t('admin.help.sections.tips'),
      icon: HelpCircle,
      content: (
        <div className="space-y-3 sm:space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.tips.generalTips')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li><strong>{t('admin.help.tips.saveFrequently')}</strong></li>
              <li><strong>{t('admin.help.tips.doubleCheck')}</strong></li>
              <li><strong>{t('admin.help.tips.useSearch')}</strong></li>
              <li><strong>{t('admin.help.tips.checkPermissions')}</strong></li>
              <li><strong>{t('admin.help.tips.mobileFriendly')}</strong></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.tips.commonIssues')}</h4>
            
            <div className="space-y-3 mt-3">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <h5 className="font-semibold text-red-900 mb-2">{t('admin.help.tips.cantLogin')}</h5>
                <ul className="list-disc list-inside text-red-800 text-sm space-y-1 ml-4">
                  <li>{t('admin.help.tips.cantLoginSolution1')}</li>
                  <li>{t('admin.help.tips.cantLoginSolution2')}</li>
                  <li>{t('admin.help.tips.cantLoginSolution3')}</li>
                  <li>{t('admin.help.tips.cantLoginSolution4')}</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h5 className="font-semibold text-yellow-900 mb-2">{t('admin.help.tips.cantSeeFeature')}</h5>
                <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1 ml-4">
                  <li>{t('admin.help.tips.cantSeeFeatureSolution1')}</li>
                  <li>{t('admin.help.tips.cantSeeFeatureSolution2')}</li>
                  <li>{t('admin.help.tips.cantSeeFeatureSolution3')}</li>
                </ul>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h5 className="font-semibold text-blue-900 mb-2">{t('admin.help.tips.uploadFailed')}</h5>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1 ml-4">
                  <li>{t('admin.help.tips.uploadFailedSolution1')}</li>
                  <li>{t('admin.help.tips.uploadFailedSolution2')}</li>
                  <li>{t('admin.help.tips.uploadFailedSolution3')}</li>
                  <li>{t('admin.help.tips.uploadFailedSolution4')}</li>
                </ul>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h5 className="font-semibold text-green-900 mb-2">{t('admin.help.tips.changesNotSaved')}</h5>
                <ul className="list-disc list-inside text-green-800 text-sm space-y-1 ml-4">
                  <li>{t('admin.help.tips.changesNotSavedSolution1')}</li>
                  <li>{t('admin.help.tips.changesNotSavedSolution2')}</li>
                  <li>{t('admin.help.tips.changesNotSavedSolution3')}</li>
                  <li>{t('admin.help.tips.changesNotSavedSolution4')}</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{t('admin.help.tips.gettingHelp')}</h4>
            <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-gray-700 ml-2 sm:ml-4 text-xs sm:text-sm leading-relaxed">
              <li>{t('admin.help.tips.gettingHelpStep1')}</li>
              <li>{t('admin.help.tips.gettingHelpStep2')}</li>
              <li>{t('admin.help.tips.gettingHelpStep3')}</li>
              <li>{t('admin.help.tips.gettingHelpStep4')}</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-800 text-sm">
              {t('admin.help.tips.remember')}
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Link href="/admin/dashboard" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('admin.help.backToDashboard')}</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-2 sm:gap-3">
                    <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-orange-600 flex-shrink-0" />
                    <span className="break-words">{t('admin.help.title')}</span>
                  </span>
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
                  {t('admin.help.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 md:p-6 rounded-lg mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base md:text-lg">{t('admin.help.welcome')}</h3>
              <p className="text-blue-800 text-xs sm:text-sm mb-1 sm:mb-2 leading-relaxed">
                {t('admin.help.welcomeDesc')}
              </p>
              <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                <strong>{t('admin.help.yourRole')}</strong> {isSuperAdmin ? t('admin.help.general.superAdmin') : isDistrictAdmin ? t('admin.help.general.districtAdmin') : t('admin.help.general.admin')} - 
                {t('admin.help.general.someFeaturesNotAvailable')}
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3 sm:space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const Icon = section.icon;

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors p-3 sm:p-4 md:p-6"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg md:text-xl truncate">{section.title}</CardTitle>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 p-3 sm:p-4 md:p-6">
                    <div className="prose prose-sm sm:prose-base max-w-none">{section.content}</div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-6 sm:mt-8 md:mt-12 bg-gray-100 p-4 sm:p-5 md:p-6 rounded-lg text-center">
          <p className="text-gray-700 text-sm sm:text-base">
            <strong>{t('admin.help.stillNeedHelp')}</strong> {t('admin.help.contactSuperAdmin')}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            {t('admin.help.bookmarkNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

