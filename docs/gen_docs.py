#!/usr/bin/env python3
"""تولید خودکار کالکشن Postman و OpenAPI از یک spec واحد.
اجرا:  python3 gen_docs.py   (خروجی: postman_collection.json, postman_environment.json, openapi.json)
با تغییر/افزودن endpoint، این فایل را به‌روز و دوباره اجرا کنید."""
import json, re

# (folder, name, method, path, auth, body, query, test_script_lines, extra_headers)
# auth: none | user | staff | admin
CART = {"X-Cart-Token": "{{cartToken}}"}
SAVE_CART = ['var j=pm.response.json(); if(j.token){pm.collectionVariables.set("cartToken", j.token);}']
SAVE_AUTH = ['var j=pm.response.json(); pm.collectionVariables.set("accessToken", j.accessToken); pm.collectionVariables.set("refreshToken", j.refreshToken);']
S = []
def add(*a): S.append(a)

add("Auth","ثبت‌نام","POST","/auth/register","none",{"email":"user@example.com","password":"User@12345","firstName":"علی","lastName":"رضایی","phoneNumber":"09121234567"},None,SAVE_AUTH,None)
add("Auth","ورود مشتری","POST","/auth/login","none",{"identifier":"user@example.com","password":"User@12345"},None,SAVE_AUTH,None)
add("Auth","ورود مدیر (کاربر seed)","POST","/auth/login","none",{"identifier":"admin@shop.local","password":"Admin@12345"},None,SAVE_AUTH,None)
add("Auth","Refresh توکن","POST","/auth/refresh","none",{"refreshToken":"{{refreshToken}}"},None,SAVE_AUTH,None)
add("Auth","خروج","POST","/auth/logout","none",{"refreshToken":"{{refreshToken}}"},None,None,None)

add("Account","مشاهده پروفایل","GET","/account/profile","user",None,None,None,None)
add("Account","ویرایش پروفایل","PUT","/account/profile","user",{"firstName":"علی","lastName":"رضایی","phoneNumber":"09121234567"},None,None,None)
add("Account","تغییر رمز","POST","/account/change-password","user",{"currentPassword":"User@12345","newPassword":"User@67890"},None,None,None)
add("Account","لیست آدرس‌ها","GET","/account/addresses","user",None,None,['var j=pm.response.json(); if(j.length){pm.collectionVariables.set("addressId", j[0].id);}'],None)
add("Account","افزودن آدرس","POST","/account/addresses","user",{"title":"خانه","receiverName":"علی رضایی","receiverPhone":"09121234567","province":"تهران","city":"تهران","postalCode":"1234567890","addressLine":"خیابان ولیعصر، پلاک ۱","isDefault":True},None,['pm.collectionVariables.set("addressId", pm.response.json().id);'],None)
add("Account","ویرایش آدرس","PUT","/account/addresses/{{addressId}}","user",{"title":"محل کار","receiverName":"علی رضایی","receiverPhone":"09121234567","province":"تهران","city":"تهران","postalCode":"1234567890","addressLine":"میدان ونک","isDefault":False},None,None,None)
add("Account","حذف آدرس","DELETE","/account/addresses/{{addressId}}","user",None,None,None,None)

add("Catalog","لیست محصولات","GET","/products","none",None,{"search":"","categorySlug":"","minPrice":"","maxPrice":"","inStockOnly":"false","sort":"Newest","page":"1","pageSize":"20"},['var j=pm.response.json(); if(j.items.length){pm.collectionVariables.set("productId", j.items[0].id); pm.collectionVariables.set("productSlug", j.items[0].slug);}'],None)
add("Catalog","جزئیات محصول","GET","/products/{{productSlug}}","none",None,None,None,None)
add("Catalog","درخت دسته‌بندی‌ها","GET","/categories","none",None,None,None,None)
add("Catalog","نظرات محصول","GET","/products/{{productId}}/reviews","none",None,{"page":"1","pageSize":"20"},None,None)
add("Catalog","ثبت نظر","POST","/products/{{productId}}/reviews","user",{"rating":5,"comment":"عالی بود"},None,None,None)
add("Catalog","تنظیمات عمومی فروشگاه","GET","/settings/public","none",None,None,None,None)

add("Cart","مشاهده سبد","GET","/cart","none",None,None,SAVE_CART,CART)
add("Cart","افزودن به سبد","POST","/cart/items","none",{"productId":"{{productId}}","quantity":1},None,SAVE_CART,CART)
add("Cart","تغییر تعداد (0=حذف)","PUT","/cart/items/{{productId}}","none",{"quantity":2},None,SAVE_CART,CART)
add("Cart","حذف کالا از سبد","DELETE","/cart/items/{{productId}}","none",None,None,SAVE_CART,CART)
add("Cart","خالی‌کردن سبد","DELETE","/cart","none",None,None,None,CART)
add("Cart","اعمال کد تخفیف","POST","/cart/coupon","none",{"code":"WELCOME10"},None,None,CART)
add("Cart","حذف کد تخفیف","DELETE","/cart/coupon","none",None,None,None,CART)
add("Cart","ادغام سبد مهمان بعد از ورود","POST","/cart/merge","user",None,None,None,CART)

add("Checkout","روش‌های ارسال","GET","/shipping-methods","none",None,None,['var j=pm.response.json(); if(j.length){pm.collectionVariables.set("shippingMethodId", j[0].id);}'],None)
add("Checkout","پیش‌نمایش مبلغ نهایی","POST","/checkout/preview","user",{"shippingMethodId":"{{shippingMethodId}}"},None,None,None)
add("Checkout","ثبت سفارش","POST","/checkout","user",{"addressId":"{{addressId}}","shippingMethodId":"{{shippingMethodId}}","note":"لطفاً قبل از ارسال تماس بگیرید"},None,['var j=pm.response.json(); pm.collectionVariables.set("orderId", j.id); pm.collectionVariables.set("orderNumber", j.orderNumber);'],None)

add("Payment","درگاه‌های فعال","GET","/payments/gateways","user",None,None,None,None)
add("Payment","شروع پرداخت","POST","/payments/start","user",{"orderId":"{{orderId}}","gateway":"Fake"},None,['var j=pm.response.json(); pm.collectionVariables.set("paymentId", j.paymentId); console.log("برای پرداخت این آدرس را در مرورگر باز کنید:", j.paymentUrl);'],None)
add("Payment","Callback درگاه (JSON برای تست)","GET","/payments/callback/{{paymentId}}","none",None,{"authority":"","status":"OK","format":"json"},None,None)

add("Orders","سفارش‌های من","GET","/orders","user",None,{"page":"1","pageSize":"20"},None,None)
add("Orders","جزئیات سفارش من","GET","/orders/{{orderNumber}}","user",None,None,None,None)
add("Orders","لغو سفارش پرداخت‌نشده","POST","/orders/{{orderNumber}}/cancel","user",None,None,None,None)
add("Orders","پیگیری سفارش (عمومی)","POST","/orders/track","none",{"orderNumber":"{{orderNumber}}","phone":"09121234567"},None,None,None)

P={"name":"محصول جدید","slug":"","sku":"SKU-100","shortDescription":"توضیح کوتاه","description":"توضیحات کامل","brand":"برند","price":500000,"compareAtPrice":600000,"stockQuantity":20,"trackInventory":True,"isActive":True,"isFeatured":False,"weight":1.5,"categoryId":"{{categoryId}}","attributes":[{"name":"رنگ","value":"قرمز"}]}
add("Admin - Products","لیست محصولات","GET","/admin/products","staff",None,{"search":"","isActive":"","lowStockOnly":"false","page":"1","pageSize":"20"},['var j=pm.response.json(); if(j.items.length){pm.collectionVariables.set("adminProductId", j.items[0].id);}'],None)
add("Admin - Products","جزئیات محصول","GET","/admin/products/{{adminProductId}}","staff",None,None,None,None)
add("Admin - Products","افزودن محصول","POST","/admin/products","staff",P,None,['pm.collectionVariables.set("adminProductId", pm.response.json().id);'],None)
add("Admin - Products","ویرایش محصول","PUT","/admin/products/{{adminProductId}}","staff",P,None,None,None)
add("Admin - Products","حذف محصول","DELETE","/admin/products/{{adminProductId}}","staff",None,None,None,None)
add("Admin - Products","تنظیم موجودی","POST","/admin/products/{{adminProductId}}/stock","staff",{"newQuantity":50,"reason":"ورود کالا"},None,None,None)
add("Admin - Products","آپلود تصویر (form-data: File, AltText, IsMain)","POST","/admin/products/{{adminProductId}}/images","staff","FORMDATA",None,['pm.collectionVariables.set("imageId", pm.response.json().id);'],None)
add("Admin - Products","حذف تصویر","DELETE","/admin/products/{{adminProductId}}/images/{{imageId}}","staff",None,None,None,None)
add("Admin - Products","تصویر اصلی","PUT","/admin/products/{{adminProductId}}/images/{{imageId}}/main","staff",None,None,None,None)
add("Admin - Categories","لیست دسته‌ها","GET","/admin/categories","staff",None,None,['var j=pm.response.json(); if(j.length){pm.collectionVariables.set("categoryId", j[0].id);}'],None)
add("Admin - Categories","افزودن دسته","POST","/admin/categories","staff",{"name":"دسته جدید","slug":"","description":"","imageUrl":None,"parentId":None,"sortOrder":0,"isActive":True},None,['pm.collectionVariables.set("categoryId", pm.response.json().id);'],None)
add("Admin - Categories","ویرایش دسته","PUT","/admin/categories/{{categoryId}}","staff",{"name":"دسته ویرایش‌شده","slug":"","description":"","imageUrl":None,"parentId":None,"sortOrder":1,"isActive":True},None,None,None)
add("Admin - Categories","حذف دسته","DELETE","/admin/categories/{{categoryId}}","staff",None,None,None,None)
add("Admin - Orders","لیست سفارش‌ها","GET","/admin/orders","staff",None,{"status":"","search":"","from":"","to":"","page":"1","pageSize":"20"},None,None)
add("Admin - Orders","جزئیات سفارش","GET","/admin/orders/{{orderNumber}}","staff",None,None,None,None)
add("Admin - Orders","تغییر وضعیت سفارش","PUT","/admin/orders/{{orderNumber}}/status","staff",{"status":"Shipped","note":"تحویل پست شد","trackingCode":"24000123456789012345"},None,None,None)
add("Admin - Coupons","لیست کوپن‌ها","GET","/admin/coupons","staff",None,None,['var j=pm.response.json(); if(j.length){pm.collectionVariables.set("couponId", j[0].id);}'],None)
add("Admin - Coupons","ایجاد کوپن","POST","/admin/coupons","staff",{"code":"SUMMER20","description":"تخفیف تابستانه","type":"Percent","value":20,"maxDiscountAmount":300000,"minOrderAmount":500000,"usageLimit":100,"startsAt":None,"expiresAt":None,"isActive":True},None,['pm.collectionVariables.set("couponId", pm.response.json().id);'],None)
add("Admin - Coupons","ویرایش کوپن","PUT","/admin/coupons/{{couponId}}","staff",{"code":"SUMMER20","description":"","type":"FixedAmount","value":50000,"maxDiscountAmount":None,"minOrderAmount":None,"usageLimit":None,"startsAt":None,"expiresAt":None,"isActive":True},None,None,None)
add("Admin - Coupons","حذف کوپن","DELETE","/admin/coupons/{{couponId}}","staff",None,None,None,None)
SH={"name":"تیپاکس","description":"ارسال با تیپاکس","cost":60000,"freeAboveAmount":3000000,"estimatedDays":3,"sortOrder":3,"isActive":True}
add("Admin - Shipping","لیست روش‌های ارسال","GET","/admin/shipping-methods","staff",None,None,['var j=pm.response.json(); if(j.length){pm.collectionVariables.set("adminShippingId", j[0].id);}'],None)
add("Admin - Shipping","افزودن روش ارسال","POST","/admin/shipping-methods","staff",SH,None,['pm.collectionVariables.set("adminShippingId", pm.response.json().id);'],None)
add("Admin - Shipping","ویرایش روش ارسال","PUT","/admin/shipping-methods/{{adminShippingId}}","staff",SH,None,None,None)
add("Admin - Shipping","حذف روش ارسال","DELETE","/admin/shipping-methods/{{adminShippingId}}","staff",None,None,None,None)
add("Admin - Reviews","لیست نظرات","GET","/admin/reviews","staff",None,{"isApproved":"false","page":"1","pageSize":"20"},['var j=pm.response.json(); if(j.items.length){pm.collectionVariables.set("reviewId", j.items[0].id);}'],None)
add("Admin - Reviews","تایید نظر","PUT","/admin/reviews/{{reviewId}}/approve","staff",None,None,None,None)
add("Admin - Reviews","رد نظر","PUT","/admin/reviews/{{reviewId}}/reject","staff",None,None,None,None)
add("Admin - Reviews","حذف نظر","DELETE","/admin/reviews/{{reviewId}}","staff",None,None,None,None)
add("Admin - Users (Admin)","لیست کاربران","GET","/admin/users","admin",None,{"search":"","role":"","page":"1","pageSize":"20"},['var j=pm.response.json(); if(j.items.length){pm.collectionVariables.set("userId", j.items[0].id);}'],None)
add("Admin - Users (Admin)","جزئیات کاربر","GET","/admin/users/{{userId}}","admin",None,None,None,None)
add("Admin - Users (Admin)","تغییر نقش/وضعیت","PUT","/admin/users/{{userId}}","admin",{"role":"Manager","isActive":True},None,None,None)
add("Admin - Settings (Admin)","همه تنظیمات","GET","/admin/settings","admin",None,None,None,None)
add("Admin - Settings (Admin)","به‌روزرسانی تنظیمات","PUT","/admin/settings","admin",{"settings":{"Store.Name":"فروشگاه من","Tax.Percent":"10","Order.PendingExpirationMinutes":"30"}},None,None,None)
add("Admin - Dashboard","داشبورد آماری","GET","/admin/dashboard","staff",None,None,None,None)

VARS=["baseUrl","accessToken","refreshToken","cartToken","productId","productSlug","addressId","shippingMethodId","orderId","orderNumber","paymentId","categoryId","adminProductId","imageId","couponId","adminShippingId","reviewId","userId"]
DEFAULTS={"baseUrl":"http://localhost:8080"}

# ---------- Postman ----------
folders={}
for (fo,name,m,path,auth,body,query,tests,hdr) in S:
    url={"raw":"{{baseUrl}}/api/v1"+path,"host":["{{baseUrl}}"],"path":["api","v1"]+[p for p in path.split("/") if p]}
    if query:
        url["query"]=[{"key":k,"value":v,"disabled":(v=="")} for k,v in query.items()]
        url["raw"]+="?"+"&".join(f"{k}={v}" for k,v in query.items() if v!="")
    r={"method":m,"header":[],"url":url}
    if hdr: r["header"]+=[{"key":k,"value":v} for k,v in hdr.items()]
    if body=="FORMDATA":
        r["body"]={"mode":"formdata","formdata":[{"key":"File","type":"file","src":[]},{"key":"AltText","value":"تصویر محصول","type":"text"},{"key":"IsMain","value":"true","type":"text"}]}
    elif body is not None:
        r["header"].append({"key":"Content-Type","value":"application/json"})
        r["body"]={"mode":"raw","raw":json.dumps(body,ensure_ascii=False,indent=2),"options":{"raw":{"language":"json"}}}
    elif m in("POST","PUT"):
        pass
    if auth=="none": r["auth"]={"type":"noauth"}
    item={"name":name,"request":r,"response":[]}
    desc={"none":"عمومی","user":"نیازمند ورود (مشتری)","staff":"نیازمند نقش Admin یا Manager","admin":"فقط Admin"}[auth]
    r["description"]=desc
    if tests:
        item["event"]=[{"listen":"test","script":{"type":"text/javascript","exec":["if(pm.response.code>=200 && pm.response.code<300){"]+["  "+t for t in tests]+["}"]}}]
    folders.setdefault(fo,[]).append(item)

coll={"info":{"name":"Shop API","description":"کالکشن کامل API فروشگاه. ترتیب پیشنهادی: Auth/ورود مدیر → Admin/دسته و محصول → Auth/ورود مشتری → Catalog → Cart → Checkout → Payment. متغیرها خودکار با اسکریپت تست پر می‌شوند.","schema":"https://schema.getpostman.com/json/collection/v2.1.0/collection.json"},
 "auth":{"type":"bearer","bearer":[{"key":"token","value":"{{accessToken}}","type":"string"}]},
 "item":[{"name":k,"item":v} for k,v in folders.items()],
 "variable":[{"key":v,"value":DEFAULTS.get(v,"")} for v in VARS]}
json.dump(coll,open("postman_collection.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
env={"name":"Shop API - Local","values":[{"key":v,"value":DEFAULTS.get(v,""),"enabled":True} for v in VARS],"_postman_variable_scope":"environment"}
json.dump(env,open("postman_environment.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)

# ---------- OpenAPI (مرجع ایستا؛ نسخه زنده و دقیق‌تر در /swagger) ----------
paths={}
for (fo,name,m,path,auth,body,query,tests,hdr) in S:
    p=re.sub(r"\{\{(\w+)\}\}",r"{\1}",path)
    op={"tags":[fo],"summary":name,"responses":{"200":{"description":"موفق"},"400":{"description":"داده نامعتبر"},"401":{"description":"احراز هویت لازم است"},"403":{"description":"دسترسی ندارید"},"404":{"description":"یافت نشد"},"422":{"description":"نقض قوانین کسب‌وکار"}}}
    params=[{"name":n,"in":"path","required":True,"schema":{"type":"string"}} for n in re.findall(r"\{(\w+)\}",p)]
    if query: params+=[{"name":k,"in":"query","required":False,"schema":{"type":"string"},"example":v} for k,v in query.items()]
    if hdr: params+=[{"name":k,"in":"header","required":False,"schema":{"type":"string"}} for k in hdr]
    if params: op["parameters"]=params
    if body=="FORMDATA":
        op["requestBody"]={"content":{"multipart/form-data":{"schema":{"type":"object","properties":{"File":{"type":"string","format":"binary"},"AltText":{"type":"string"},"IsMain":{"type":"boolean"}},"required":["File"]}}}}
    elif body is not None:
        op["requestBody"]={"required":True,"content":{"application/json":{"schema":{"type":"object"},"example":body}}}
    if auth!="none": op["security"]=[{"bearerAuth":[]}]
    paths.setdefault(p,{})[m.lower()]=op
oas={"openapi":"3.0.3","info":{"title":"Shop API","version":"v1","description":"مرجع ایستای API. نسخه زنده با مدل‌های کامل: http://localhost:8080/swagger"},
 "servers":[{"url":"http://localhost:8080/api/v1"}],"paths":paths,
 "components":{"securitySchemes":{"bearerAuth":{"type":"http","scheme":"bearer","bearerFormat":"JWT"}}}}
json.dump(oas,open("openapi.json","w",encoding="utf-8"),ensure_ascii=False,indent=2)
print(len(S),"endpoints")
