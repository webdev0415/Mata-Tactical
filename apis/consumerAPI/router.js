import express from "express";
import CommentService from "../../services/comments";
import NotificationService from "../../services/notification";
import ProductService from "../../services/products";
import UserService from "../../services/users";
import { expressHandler } from "../../libs/request-handlers";
import GiftCardService from "../../services/giftCards";
import middleware from "../../middleware";
import WinnersService from "../../services/winners";
import Checkout from "../../services/checkout";
import PromoCodeService from "../../services/promoCode";

const router = express.Router();
router.use(middleware.checkLoginActivity);
//Comments API
router.post("/comments", expressHandler(CommentService.addComment));
router.put("/comments", expressHandler(CommentService.updateComment));
router.get(
  "/comments/getusercomments",
  expressHandler(CommentService.getUserComments)
);
router.get(
  "/comments/getproductcomments/:id",
  expressHandler(CommentService.getProductComments)
);

//Notifications API
router.get(
  "/notification",
  expressHandler(NotificationService.getNotification)
);
router.put(
  "/notification/read/:id",
  expressHandler(NotificationService.readNotification)
);

//Products API
router.post(
  "/products/cancel",
  expressHandler(ProductService.cancelReservedSeats)
);
router.post(
  "/products/getpurchasehistory",
  expressHandler(ProductService.getPurchaseHistory)
);
router.get(
  "/products/getwebinarreservedstatus/:id",
  expressHandler(ProductService.getWebinarReservedStatus)
);
router.get(
  "/products/webinarseats/:id",
  expressHandler(ProductService.getWebinarSeats)
);
router.post(
  "/products/getwebinarwinnerhistory",
  expressHandler(ProductService.getWebinarWinnerHistory)
);
router.post(
  "/products/purchasephysical",
  expressHandler(ProductService.purchasePhysicalProduct)
);
router.post(
  "/products/purchasewebinar",
  expressHandler(ProductService.purchaseWebinarTicket)
);
router.post(
  "/products/reservewebinarticket",
  expressHandler(ProductService.reserveWebinarTicket)
);

//User API
router.post("/users/login", expressHandler(UserService.login));
router.put("/users/profile", expressHandler(UserService.updateCurrentUser));

// Gift Cards
router.get("/gift-card", expressHandler(GiftCardService.usersGiftCards));

// Won Items
router.get("/won-item", expressHandler(WinnersService.getWonItem));
router.get("/rewards", expressHandler(WinnersService.getRewards));

router.get("/promo-code/find", expressHandler(PromoCodeService.findPromoCod));

router.post("/checkout", expressHandler(Checkout.pay));
export default router;
