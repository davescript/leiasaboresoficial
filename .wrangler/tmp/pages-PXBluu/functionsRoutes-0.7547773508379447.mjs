import { onRequestPost as __api_webhooks_stripe_ts_onRequestPost } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/webhooks/stripe.ts"
import { onRequestDelete as __api_cart__itemId__ts_onRequestDelete } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/cart/[itemId].ts"
import { onRequestGet as __api_products__id__ts_onRequestGet } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/products/[id].ts"
import { onRequestDelete as __api_cart_ts_onRequestDelete } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/cart.ts"
import { onRequestGet as __api_cart_ts_onRequestGet } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/cart.ts"
import { onRequestPost as __api_cart_ts_onRequestPost } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/cart.ts"
import { onRequestPut as __api_cart_ts_onRequestPut } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/cart.ts"
import { onRequestPost as __api_checkout_ts_onRequestPost } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/checkout.ts"
import { onRequestGet as __api_coupons_ts_onRequestGet } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/coupons.ts"
import { onRequestGet as __api_products_ts_onRequestGet } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/products.ts"
import { onRequestDelete as __api_upload_ts_onRequestDelete } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/upload.ts"
import { onRequestPost as __api_upload_ts_onRequestPost } from "/Users/davidsousa/Documents/Websites com IA/leiasaboresoficial/functions/api/upload.ts"

export const routes = [
    {
      routePath: "/api/webhooks/stripe",
      mountPath: "/api/webhooks",
      method: "POST",
      middlewares: [],
      modules: [__api_webhooks_stripe_ts_onRequestPost],
    },
  {
      routePath: "/api/cart/:itemId",
      mountPath: "/api/cart",
      method: "DELETE",
      middlewares: [],
      modules: [__api_cart__itemId__ts_onRequestDelete],
    },
  {
      routePath: "/api/products/:id",
      mountPath: "/api/products",
      method: "GET",
      middlewares: [],
      modules: [__api_products__id__ts_onRequestGet],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_cart_ts_onRequestDelete],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_cart_ts_onRequestGet],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_cart_ts_onRequestPost],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_cart_ts_onRequestPut],
    },
  {
      routePath: "/api/checkout",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_checkout_ts_onRequestPost],
    },
  {
      routePath: "/api/coupons",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_coupons_ts_onRequestGet],
    },
  {
      routePath: "/api/products",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_products_ts_onRequestGet],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_upload_ts_onRequestDelete],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_ts_onRequestPost],
    },
  ]