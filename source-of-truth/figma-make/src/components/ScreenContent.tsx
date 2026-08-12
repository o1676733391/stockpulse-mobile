import type { ReactNode } from 'react'
import { useApp } from '../context/AppContext'

import { SplashScreen, WelcomeScreen, LoginScreen, OnboardingScreen, ForgotPasswordScreen } from '../screens/auth/AuthScreens'
import { HomeScreen }         from '../screens/HomeScreen'
import { NotificationsScreen } from '../screens/NotificationsScreen'
import { InventoryListScreen, InventoryDetailScreen } from '../screens/inventory/InventoryScreens'
import { StockCountScreen, ActiveCountScreen, CountSummaryScreen } from '../screens/stockcount/StockCountScreens'
import { ScanScreen, OCRProcessingScreen, OCRReviewScreen, OCRResultScreen } from '../screens/scan/ScanScreens'
import { OrdersScreen, POQScreen, PurchaseOrderScreen } from '../screens/orders/OrdersScreens'
import { MoreScreen }         from '../screens/more/MoreScreen'
import { RecipesScreen, RecipeDetailScreen, CreateRecipeScreen, EditRecipeScreen } from '../screens/more/RecipesScreens'
import { ExpirationScreen, ExpirationItemScreen, WasteReductionScreen } from '../screens/more/ExpirationScreens'
import { GoodsReceiptsScreen, NewReceiptScreen } from '../screens/more/GoodsReceiptsScreens'
import { SuppliersScreen, SupplierDetailScreen } from '../screens/more/SuppliersScreen'
import { ReportsScreen, ArchiveScreen, AuditLogScreen } from '../screens/more/ReportsArchiveAuditScreens'
import { SettingsScreen } from '../screens/more/TeamSettingsScreens'
import { TeamScreen, AddMemberScreen, MemberDetailScreen, RoleEditorScreen } from '../screens/more/TeamScreens'

import type { Screen } from '../types'

export function ScreenContent() {
  const { screen } = useApp()

  const SCREENS: Partial<Record<Screen, ReactNode>> = {
    splash:             <SplashScreen />,
    welcome:            <WelcomeScreen />,
    login:              <LoginScreen />,
    onboarding:         <OnboardingScreen />,
    'forgot-password':  <ForgotPasswordScreen />,
    home:               <HomeScreen />,
    notifications:      <NotificationsScreen />,
    inventory:          <InventoryListScreen />,
    'inventory-detail': <InventoryDetailScreen />,
    'stock-count':      <StockCountScreen />,
    'active-count':     <ActiveCountScreen />,
    'count-summary':    <CountSummaryScreen />,
    scan:               <ScanScreen />,
    'ocr-processing':   <OCRProcessingScreen />,
    'ocr-review':       <OCRReviewScreen />,
    'ocr-result':       <OCRResultScreen />,
    orders:             <OrdersScreen />,
    poq:                <POQScreen />,
    'purchase-order':   <PurchaseOrderScreen />,
    more:               <MoreScreen />,
    recipes:            <RecipesScreen />,
    'recipe-detail':    <RecipeDetailScreen />,
    'create-recipe':    <CreateRecipeScreen />,
    'edit-recipe':      <EditRecipeScreen />,
    expiration:         <ExpirationScreen />,
    'expiration-item':  <ExpirationItemScreen />,
    'waste-reduction':  <WasteReductionScreen />,
    'goods-receipts':   <GoodsReceiptsScreen />,
    'new-receipt':      <NewReceiptScreen />,
    suppliers:          <SuppliersScreen />,
    'supplier-detail':  <SupplierDetailScreen />,
    reports:            <ReportsScreen />,
    archive:            <ArchiveScreen />,
    'audit-log':        <AuditLogScreen />,
    team:               <TeamScreen />,
    settings:           <SettingsScreen />,
    'add-member':       <AddMemberScreen />,
    'member-detail':    <MemberDetailScreen />,
    'role-editor':      <RoleEditorScreen />,
  }

  return <>{SCREENS[screen] ?? <HomeScreen />}</>
}

export const AUTH_SCREENS: Screen[] = ['splash', 'welcome', 'login', 'onboarding', 'forgot-password']
export const FULLBLEED_SCREENS: Screen[] = ['scan', 'ocr-processing', 'splash']
