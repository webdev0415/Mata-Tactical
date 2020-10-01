import express from "express";
import CategoriesService from "../../services/categories";
import FFLDatabaseService from "../../services/fflDatabases";
import WinnersService from "../../services/winners";
import FAQService from "../../services/support/FAQ";
import CommentService from "../../services/comments";
import ProductService from "../../services/products";
import SiteSettingService from "../../services/support";
import UserService from "../../services/users";
import NotificationAdminServices from "../../services/NotificationAdminServices";
import { expressHandler } from "../../libs/request-handlers";
import GiftCardService from "../../services/giftCards";
import UsersManagement from "../../services/usersManagement";
import PromoCodeService from "../../services/promoCode";
import AnalyticsService from "../../services/analytics";
import Checkout from "../../services/checkout";
import RolesService from "../../services/roles";
import ShippingService from "../../services/shipping";
import BackgroundService from "../../services/background";
import middleware from "../../middleware";
import { permissionsList } from "./../../services/roles";
const router = express.Router();

// Categories API
router.get(
  "/categories",
  // middleware.checkPermissions(permissionsList.categoryView),
  expressHandler(CategoriesService.getCategories)
);
router.post(
  "/categories",
  middleware.checkPermissions(permissionsList.categoryEdit),
  expressHandler(CategoriesService.addCategory)
);
router.patch(
  "/categories/:id",
  middleware.checkPermissions(permissionsList.categoryEdit),
  expressHandler(CategoriesService.updateCategory)
);
router.delete(
  "/categories",
  middleware.checkPermissions(permissionsList.categoryEdit),
  expressHandler(CategoriesService.deleteCategory)
);

// FFL Databases API
router.get(
  "/ffl-databases",
  // middleware.checkPermissions(permissionsList.fflView),
  expressHandler(FFLDatabaseService.getDatabases)
);
router.post(
  "/ffl-databases",
  middleware.checkPermissions(permissionsList.fflEdit),
  expressHandler(FFLDatabaseService.addDatabase)
);
router.put(
  "/ffl-databases/:id",
  middleware.checkPermissions(permissionsList.fflEdit),
  expressHandler(FFLDatabaseService.updateFFL)
);
router.delete('/ffl-databases/:id', expressHandler(FFLDatabaseService.deleteFFL));
// Winners API
router.post("/winners", expressHandler(WinnersService.addWinners));
router.put("/winners", expressHandler(WinnersService.updateWinners));

// FAQ
router.post(
  "/faq",
  middleware.checkPermissions(permissionsList.faqEdit),
  expressHandler(FAQService.addFAQ)
);
router.patch(
  "/faq/:id",
  middleware.checkPermissions(permissionsList.faqEdit),
  expressHandler(FAQService.updateFAQ)
);
router.delete(
  "/faq/:id",
  middleware.checkPermissions(permissionsList.faqEdit),
  expressHandler(FAQService.deleteFAQ)
);

//Comments
router.delete("/comments/:id", expressHandler(CommentService.deleteComment));
router.post("/comments/pin", expressHandler(CommentService.pinComment));

//Products
router.post(
  "/products/physical",
  middleware.checkPermissions(permissionsList.productEdit),
  expressHandler(ProductService.registerPhysicalProduct)
);
router.post(
  "/products/webinar",
  middleware.checkPermissions(permissionsList.productEdit),
  expressHandler(ProductService.registerWebinarProduct)
);
router.put(
  "/products/product",
  middleware.checkPermissions(permissionsList.productEdit,permissionsList.webinarQueueEdit),
  expressHandler(ProductService.updateProduct)
);

router.get(
  "/products/product",
  // middleware.checkPermissions(permissionsList.productView),
  expressHandler(ProductService.getProductForAdmin)
);
router.post(
  "/products/images",
  middleware.checkPermissions(permissionsList.productEdit),
  expressHandler(ProductService.uploadImagesToGallery)
);
router.delete(
  "/products/images",
  middleware.checkPermissions(permissionsList.productEdit),
  expressHandler(ProductService.removeImagesFromGallery)
);
router.get(
  "/products/images",
  middleware.checkPermissions(permissionsList.productView),
  expressHandler(ProductService.getImageGallery)
);
router.get(
  "/products/product/listings",
  middleware.checkPermissions(permissionsList.productView, permissionsList.promoCodesEdit),
  expressHandler(ProductService.getProductsForListingOptions)
);
router.get(
  "/products/product/webinar/soldout",
  middleware.checkPermissions(permissionsList.soldOutWebinarsView),
  expressHandler(ProductService.getWebinarSoldOut)
);
router.put(
  "/products/product/webinar/start",
  middleware.checkPermissions(permissionsList.soldOutWebinarsEdit),
  expressHandler(ProductService.startLiveStream)
);
router.get(
  "/products/product/webinar/queue",
  middleware.checkPermissions(permissionsList.webinarQueueView),
  expressHandler(ProductService.getQueueList)
);

//SiteSettings
router.put(
  "/support/sitesettings",
  expressHandler(SiteSettingService.updateSiteSettings)
);
router.put(
  "/support/sitesettings-advanced",
  middleware.checkPermissions(permissionsList.settingsEdit),
  expressHandler(SiteSettingService.updateSiteSettings)
);
router.put(
  "/support/sitesettings-general",
  middleware.checkPermissions(permissionsList.settingsEdit),
  expressHandler(SiteSettingService.updateSiteSettings)
);
router.put(
  "/support/sitesettings-queue",
  middleware.checkPermissions(permissionsList.productEdit),
  expressHandler(SiteSettingService.updateSiteSettings)
);

//User
router.post("/users/ban", expressHandler(UserService.banUser));
router.put(
  "/users/updateuserforadmin/:id",
  expressHandler(UserService.updateUserForAdmin)
);

//Notification

router.get(
  "/notification",
  expressHandler(NotificationAdminServices.getNotifications)
);
router.patch(
  "/notification/:id",
  expressHandler(NotificationAdminServices.readNotifications)
);

// Gift Card
router.get(
  "/gift-card",
  middleware.checkPermissions(permissionsList.giftCardsView),
  expressHandler(GiftCardService.getAllGiftCards)
);
router.post(
  "/gift-card",
  middleware.checkPermissions(permissionsList.giftCardsEdit),
  expressHandler(GiftCardService.createCard)
);

// Users Management
router.get(
  "/users-management",
  // middleware.checkPermissions(permissionsList.usersView),
  expressHandler(UsersManagement.getAllUsers)
);
router.get(
  "/users-management/:id",
  middleware.checkPermissions(permissionsList.usersView),
  expressHandler(UsersManagement.getUserInfoById)
);
router.put(
  "/users-management",
  middleware.checkPermissions(permissionsList.usersEdit),
  expressHandler(UsersManagement.editUserForAdmin)
);
router.delete(
  "/users-management/:id",
  middleware.checkPermissions(permissionsList.usersDelete),
  expressHandler(UsersManagement.removeUser)
);
// Promo Code
router.post(
  "/promo-code",
  middleware.checkPermissions(permissionsList.promoCodesEdit),
  expressHandler(PromoCodeService.createPromoCode)
);
router.get(
  "/promo-code",
  middleware.checkPermissions(permissionsList.promoCodesView),
  expressHandler(PromoCodeService.getAll)
);

// Dashboard Graph

router.use(
  "/analytics",
  middleware.checkPermissions(permissionsList.dashboardView)
);
router.get("/analytics/revenue", expressHandler(AnalyticsService.getRevenue));
router.get(
  "/analytics/categorysale",
  expressHandler(AnalyticsService.getCategorySales)
);
router.get(
  "/analytics/activemembers",
  expressHandler(AnalyticsService.getActiveMembers)
);
// Live Stream Mode
router.get(
  "/webinar/:webinar_id/users",
  middleware.checkPermissions(permissionsList.soldOutWebinarsEdit),
  expressHandler(ProductService.getUserForWebinar)
);
router.post(
  "/products/winners",
  middleware.checkPermissions(permissionsList.soldOutWebinarsEdit),
  expressHandler(ProductService.setWinnersToWonItem)
);

router.get(
  "/products/physical/soldout",
  middleware.checkPermissions(permissionsList.soldOutPhysicalView),
  expressHandler(ProductService.getSoldPhysicalForAdmin)
);
router.put(
  "/products/physical/soldout/ffl",
  middleware.checkPermissions(permissionsList.soldOutPhysicalEdit),
  expressHandler(ProductService.setFFLToPhysical)
);
router.get(
  "/products/webinar/complete",
  expressHandler(ProductService.getCompletedWebinarsForAdmin)
);
router.get(
  "/products/webinar/bns/complete",
  middleware.checkPermissions(permissionsList.completedWebinarsView),
  expressHandler(ProductService.getCompletedWebinarsWithPromoCode)
);
router.put(
  "/products/webinar/complete/ffl",
  middleware.checkPermissions(permissionsList.completedWebinarsEdit),
  expressHandler(ProductService.setFFLToWinner)
);
router.post("/checkout/refund", expressHandler(Checkout.refoundWithProfile));
router.get("/analytics/reports", expressHandler(AnalyticsService.getReports));
router.get(
  "/webinar/seats-taken/:id",
  expressHandler(ProductService.getTakenSeatsWebinar)
);
// Roles
router.get(
  "/roles",
  // middleware.checkPermissions(permissionsList.rolesView),
  expressHandler(RolesService.rolesList)
);
router.get(
  "/roles/:id",
  middleware.checkPermissions(permissionsList.rolesView),
  expressHandler(RolesService.getRoleById)
);
router.put(
  "/roles/:id",
  middleware.checkPermissions(permissionsList.rolesEdit),
  expressHandler(RolesService.updateRole)
);
router.post(
  "/roles",
  middleware.checkPermissions(permissionsList.rolesEdit),
  expressHandler(RolesService.addRole)
);
router.post(
  "/roles/attach/:role_id",
  middleware.checkPermissions(permissionsList.userCreateAdmin),
  expressHandler(RolesService.attachRoleToUser)
);
router.get(
  "/roles-permissions",
  middleware.checkPermissions(permissionsList.rolesView),
  expressHandler(RolesService.permissionsList)
);
router.get("/shipping_items", expressHandler(ShippingService.getShippingItems));
router.put(
  "/shipping_items/status",
  expressHandler(ShippingService.updateShippingStatus)
);
router.put(
  "/shipping_items/book",
  expressHandler(ShippingService.updateBookNumber)
);
router.put(
  "/shipping_items/grouping",
  expressHandler(ShippingService.setGroupStatus)
);

router.get("/background", expressHandler(BackgroundService.getAll));
router.put("/background/:id", expressHandler(BackgroundService.update));
router.delete("/background", expressHandler(BackgroundService.remove));
router.post("/background", expressHandler(BackgroundService.add));

export default router;
