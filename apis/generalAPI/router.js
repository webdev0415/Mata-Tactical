import express from "express";
import { expressHandler } from "../../libs/request-handlers";
import FAQService from "../../services/support/FAQ";
import ProductService from "../../services/products";
import SiteSettingService from "../../services/support";
import UserService from "../../services/users";
import BackgroundService from '../../services/background';
const router = express.Router();
// FAQ
router.get("/faq", expressHandler(FAQService.getFAQ));
//Product
router.post("/products/getall", expressHandler(ProductService.getAllProducts));
router.post("/products/getproduct", expressHandler(ProductService.getProduct));

//Site Setting
router.get("/support/sitesettings", expressHandler(SiteSettingService.getAllSiteSettings));
router.get(
  "/support/sitesettings/contactdescription",
  expressHandler(SiteSettingService.getContactUsDescription)
);
router.get(
  "/support/sitesettings/socialmedialinks",
  expressHandler(SiteSettingService.getSocialMediaLinks)
);
router.post("/support/contact", expressHandler(SiteSettingService.contactSupport));
//User
router.post("/users/forgotpassword", expressHandler(UserService.forgotPassword));
router.get("/users/verifiedstatus/:email", expressHandler(UserService.getVerifiedStatus));
router.put("/users/resetpassword", expressHandler(UserService.resetPassword));
router.put("/users/verifiedstatus/:email", expressHandler(UserService.setVerifiedStatus));
router.post("/users", expressHandler(UserService.signup));
router.put("/users/signout", expressHandler(UserService.signout));
router.put("/users/forgetlink/verify", expressHandler(UserService.validateForgetLink));
router.get('/background/active',expressHandler(BackgroundService.getActiveImage));
export default router;
