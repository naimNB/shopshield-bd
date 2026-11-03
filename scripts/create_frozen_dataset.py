"""Script to generate the untouched frozen evaluation benchmark dataset (evaluation/frozen_dataset.json).

Contains 42 challenging scenarios representative of Bangladesh digital commerce:
- Pure Bangla, Banglish, English, and Mixed language formats
- Explicit negations, regional COD, zero advance, BOGO/combo vs single unit,
  expired promotions, replacement vs cash refund, service vs parts warranty,
  and payment safety risk considerations.
"""

import json
import os

SCENARIOS = [
    {
        "id": "frozen_01",
        "title": "Formal Shirt: Advance Courier Charge Outside Dhaka (Bangla)",
        "category": "advance_delivery_charge",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "ছেলেদের ফরমাল শার্ট কালেকশন। ১০০% প্রিমিয়াম কটন। বিশেষ মূল্য ৯৫০ টাকা। ক্যাশ অন ডেলিভারি প্রযোজ্য। সাইজ সমস্যা হলে ৩ দিনের রিপ্লেসমেন্ট সুবিধা।",
        "seller_chat_text": "শার্টের দাম ৯৫০ টাকাই ভাই। তবে ডেলিভারি নিশ্চিত করার জন্য ১০০ টাকা কুরিয়ার চার্জ অগ্রিম বিকাশ করতে হবে। বাকি ৮৫০ টাকা ক্যাশ অন ডেলিভারিতে দিবেন।",
        "expected": {
            "expected_price_ad": 950.0,
            "expected_price_chat": 950.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 100.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_02",
        "title": "Gaming Mouse: Advance Delivery Charge (Banglish)",
        "category": "advance_delivery_charge",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "RGB Gaming Mouse 6400 DPI. Dhamaka offer price matro 650 taka. Shara deshe cash on delivery. 6 months warranty.",
        "seller_chat_text": "Bhai mouse er dam 650 tk. Cash on delivery available. Delivery charge 120 taka advance pathate hobe bkash e, baki taka delivery te.",
        "expected": {
            "expected_price_ad": 650.0,
            "expected_price_chat": 650.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 120.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_03",
        "title": "Passport Wallet: Zero Advance in Ad vs Advance in Chat (Bangla Contradiction)",
        "category": "advance_contradiction",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "লেদার পাসপোর্ট ওয়ালেট। মূল্য ১২০০ টাকা। সম্পূর্ণ ক্যাশ অন ডেলিভারি, কোনো অগ্রিম ছাড়াই অর্ডার করুন।",
        "seller_chat_text": "ওয়ালেটের দাম ১২০০ টাকা। ক্যাশ অন ডেলিভারি পাবেন। তবে অর্ডার বুকিং এর জন্য ২০০ টাকা বুকিং ফি অগ্রিম বিকাশ করতে হবে।",
        "expected": {
            "expected_price_ad": 1200.0,
            "expected_price_chat": 1200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 200.0,
            "expected_advance_purpose": "BOOKING_FEE",
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["advance_payment"],
            "expected_payment_warnings": ["ADVANCE_BOOKING_FEE"]
        }
    },
    {
        "id": "frozen_04",
        "title": "Charging Cable: Expired Promotional Price (Banglish Needs Review)",
        "category": "conditional_expired_offer",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Original Anker fast charging cable. Price 350 taka. Cash on delivery available. 7 days replacement guarantee.",
        "seller_chat_text": "Anker cable er dam ekhon 550 taka bhaiya, 350 taka offer expired hoye geche. Cash on delivery paben.",
        "expected": {
            "expected_price_ad": 350.0,
            "expected_price_chat": 550.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_05",
        "title": "Cotton Three-Piece: Flat Price Discrepancy (Bangla Contradiction)",
        "category": "price_contradiction",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "মহিলাদের তাঁতের সুতি থ্রি-পিস। ফিক্সড প্রাইজ ৮০০ টাকা। সারা দেশে ক্যাশ অন ডেলিভারি।",
        "seller_chat_text": "আপু এই ড্রেসের দাম ১০০০ টাকা। ক্যাশ অন ডেলিভারি আছে, কিন্তু ৮০০ টাকায় দিতে পারব না।",
        "expected": {
            "expected_price_ad": 800.0,
            "expected_price_chat": 1000.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["price"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_06",
        "title": "Mechanical Keyboard: Full Upfront Advance Demanded (English Contradiction)",
        "category": "advance_full_payment",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Imported Mechanical Keyboard Blue Switch. Price 3200 BDT. Nationwide home delivery. Cash on delivery available.",
        "seller_chat_text": "Hello, keyboard price is 3200 BDT. You must pay full 3200 advance via bKash before we dispatch. No cash on delivery available.",
        "expected": {
            "expected_price_ad": 3200.0,
            "expected_price_chat": 3200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": False,
            "expected_advance_required": True,
            "expected_advance_amount": 3200.0,
            "expected_advance_purpose": "FULL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["cod_availability"],
            "expected_payment_warnings": ["ADVANCE_FULL_PAYMENT", "COD_DENIED_OR_CONFLICT"]
        }
    },
    {
        "id": "frozen_07",
        "title": "Soundbar Speaker: Return Denial in Chat (Bangla Contradiction)",
        "category": "return_contradiction",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "ব্লুটুথ স্পিকার সাউন্ডবার। বিশেষ মূল্য ১৮০০ টাকা। ক্যাশ অন ডেলিভারি। পছন্দ না হলে ৭ দিনের ইজি রিটার্ন পলিসি।",
        "seller_chat_text": "স্পিকারের দাম ১৮০০ টাকা। ক্যাশ অন ডেলিভারি পাবেন। তবে ভাই বিক্রি হয়ে গেলে কোনো রিটার্ন বা টাকা ফেরত নেওয়া হবে না।",
        "expected": {
            "expected_price_ad": 1800.0,
            "expected_price_chat": 1800.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": False,
            "has_contradiction": True,
            "contradiction_fields": ["return_policy"],
            "expected_payment_warnings": ["NO_RETURN_POLICY"]
        }
    },
    {
        "id": "frozen_08",
        "title": "Fleece Hoodie: Combo Pack vs Single Unit (Banglish Needs Review)",
        "category": "conditional_combo",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Winter special offer! 2 ta hoodie combo pack matro 1500 taka. Cash on delivery shob jaygay.",
        "seller_chat_text": "Bhaiya single 1 ta hoodie er dam 850 taka. 2 ta nile 1500 tk combo offer paben. Cash on delivery ache.",
        "expected": {
            "expected_price_ad": 1500.0,
            "expected_price_chat": 850.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_09",
        "title": "Jute Shoes: Regional COD Policy (Bangla Needs Review)",
        "category": "conditional_regional_cod",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "হ্যান্ডমেড পাটের জুতা। দাম ৭৫০ টাকা। ঢাকার ভেতর ক্যাশ অন ডেলিভারি সুবিধা আছে।",
        "seller_chat_text": "জুতার দাম ৭৫০ টাকা ভাইয়া। ঢাকার বাইরে ক্যাশ অন ডেলিভারি নেই, কুরিয়ার চার্জ ১৫০ টাকা অগ্রিম দেওয়া লাগবে।",
        "expected": {
            "expected_price_ad": 750.0,
            "expected_price_chat": 750.0,
            "expected_cod_ad": True,
            "expected_cod_chat": False,
            "expected_advance_required": True,
            "expected_advance_amount": 150.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_10",
        "title": "Smart TV: Official vs Service Warranty (English Needs Review)",
        "category": "conditional_warranty_scope",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Smart LED TV 32 inch. Price 14500 BDT. Cash on delivery available. 2 years warranty.",
        "seller_chat_text": "Price is 14500 BDT. Cash on delivery available. We provide 2 years service warranty only, panel and parts are not covered.",
        "expected": {
            "expected_price_ad": 14500.0,
            "expected_price_chat": 14500.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_11",
        "title": "Watch: Seller Waives Advance in Chat (Bangla Concession)",
        "category": "advance_waived",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "সুইস ওয়াচ কালেকশন। মূল্য ২৫০০ টাকা। ডেলিভারি চার্জ ১৫০ টাকা অগ্রিম দিয়ে অর্ডার কনফার্ম করুন। ক্যাশ অন ডেলিভারি।",
        "seller_chat_text": "ওয়াচের দাম ২৫০০ টাকা ভাই। ক্যাশ অন ডেলিভারি পাবেন। আপনার জন্য ডেলিভারি চার্জের কোনো অগ্রিম লাগবে না, ডেলিভারির সময় সম্পূর্ণ ২৫০০ টাকা দিলেই হবে।",
        "expected": {
            "expected_price_ad": 2500.0,
            "expected_price_chat": 2500.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": False,
            "expected_advance_amount": 0.0,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_12",
        "title": "Polo Shirt: Consistent Zero Advance (Banglish)",
        "category": "zero_advance_consistent",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Men casual polo shirt. Price 450 taka. Shara deshe cash on delivery. No advance needed.",
        "seller_chat_text": "Polo shirt er dam 450 tk bhaiya. Cash on delivery paben. Kono advance lagbe na, delivery te full payment diben.",
        "expected": {
            "expected_price_ad": 450.0,
            "expected_price_chat": 450.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": False,
            "expected_advance_amount": 0.0,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_13",
        "title": "Mustard Oil: Advance Amount Mismatch (Bangla Contradiction)",
        "category": "advance_amount_mismatch",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "অর্গানিক সরিষার তেল ৫ লিটার। মূল্য ১২৫০ টাকা। অর্ডার বুক করতে ১০০ টাকা অগ্রিম বিকাশ করুন। ক্যাশ অন ডেলিভারি।",
        "seller_chat_text": "তেলের দাম ১২৫০ টাকা। ক্যাশ অন ডেলিভারি আছে। তবে অর্ডার কনফার্ম করার জন্য ৩০০ টাকা অগ্রিম পাঠাতে হবে। বাকি ৯৫০ ডেলিভারিতে।",
        "expected": {
            "expected_price_ad": 1250.0,
            "expected_price_chat": 1250.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 300.0,
            "expected_advance_purpose": "UNSPECIFIED",
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["advance_payment"],
            "expected_payment_warnings": ["ADVANCE_UNSPECIFIED_PURPOSE"]
        }
    },
    {
        "id": "frozen_14",
        "title": "Headphones: Replacement vs Cash Refund Scope (English Needs Review)",
        "category": "conditional_refund_scope",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Wireless Noise Cancelling Headphones. Price 4500 BDT. Cash on delivery available. 7 days return or replacement guarantee.",
        "seller_chat_text": "Headphone price is 4500. Cash on delivery available. If defective, we offer 7 days replacement exchange, but no cash refund.",
        "expected": {
            "expected_price_ad": 4500.0,
            "expected_price_chat": 4500.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_15",
        "title": "Sunglasses: Missing Price in Ad (Bangla Ad-Only)",
        "category": "ad_missing_price",
        "language": "bangla",
        "mode": "ad_only",
        "advertisement_text": "আমদানিকৃত প্রিমিয়াম রোদচশমা (Sunglasses)। ১০০% ইউভি প্রটেকশন। ঢাকার ভেতর ক্যাশ অন ডেলিভারি। ইনবক্সে দাম জানুন।",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": None,
            "expected_price_chat": None,
            "expected_cod_ad": True,
            "expected_cod_chat": None,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["price"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_16",
        "title": "Denim Jacket: Missing COD and Return (Banglish Ad-Only)",
        "category": "ad_missing_terms",
        "language": "banglish",
        "mode": "ad_only",
        "advertisement_text": "Denim jacket slim fit. Price 1850 taka. Export quality fabric. Delivery charge 100 taka inside dhaka.",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 1850.0,
            "expected_price_chat": None,
            "expected_cod_ad": None,
            "expected_cod_chat": None,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["cod", "return_policy"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_17",
        "title": "Name Locket: 100% Upfront Advance in Ad (Bangla Ad-Only)",
        "category": "ad_full_advance",
        "language": "bangla",
        "mode": "ad_only",
        "advertisement_text": "কাস্টমাইজড নেম লকেট। ব্রাস গোল্ড প্লেটেড। মূল্য ৮৫০ টাকা। কাস্টম পণ্যের জন্য ১০০% ফুল পেমেন্ট অগ্রিম বিকাশ করতে হবে।",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 850.0,
            "expected_price_chat": None,
            "expected_cod_ad": None,
            "expected_cod_chat": None,
            "expected_advance_required": True,
            "expected_advance_amount": 850.0,
            "expected_advance_purpose": "FULL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["cod"],
            "expected_payment_warnings": ["ADVANCE_FULL_PAYMENT"]
        }
    },
    {
        "id": "frozen_18",
        "title": "Running Shoes: Advance Delivery Charge in Ad (Banglish Ad-Only)",
        "category": "ad_delivery_charge",
        "language": "banglish",
        "mode": "ad_only",
        "advertisement_text": "Nike running shoes master copy. Offer price 2200 tk. Delivery charge 150 taka advance bKash kore order confirm korun. Cash on delivery available.",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 2200.0,
            "expected_price_chat": None,
            "expected_cod_ad": True,
            "expected_cod_chat": None,
            "expected_advance_required": True,
            "expected_advance_amount": 150.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["return_policy"],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_19",
        "title": "Clearance Kurti: Explicit No Return Policy (Bangla Ad-Only)",
        "category": "ad_no_return",
        "language": "bangla",
        "mode": "ad_only",
        "advertisement_text": "ক্লিয়ারেন্স সেল! লেডিস কুর্তি ও প্লাজো সেট। মূল্য মাত্র ৫০০ টাকা। ক্যাশ অন ডেলিভারি সুবিধা আছে। বিক্রি হওয়া পণ্য কোনোভাবেই ফেরত নেওয়া হবে না।",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 500.0,
            "expected_price_chat": None,
            "expected_cod_ad": True,
            "expected_cod_chat": None,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": False,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": [],
            "expected_payment_warnings": ["NO_RETURN_POLICY"]
        }
    },
    {
        "id": "frozen_20",
        "title": "Action Camera: Urgency Pressure in Ad (English Ad-Only)",
        "category": "ad_urgency",
        "language": "english",
        "mode": "ad_only",
        "advertisement_text": "Flash deal! 4K Action Camera only 3500 BDT. Hurry, limited time offer ending in 3 hours! Cash on delivery available. Conditions apply.",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 3500.0,
            "expected_price_chat": None,
            "expected_cod_ad": True,
            "expected_cod_chat": None,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["return_policy"],
            "expected_payment_warnings": ["IMMEDIATE_URGENCY_PRESSURE"]
        }
    },
    {
        "id": "frozen_21",
        "title": "Electric Kettle: Bengali Numerals & Advance Delivery Charge (Bangla)",
        "category": "advance_delivery_charge",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "স্টেইনলেস স্টিল ইলেকট্রিক কেটলি ২ লিটার। দাম ৯৫০ টাকা। ক্যাশ অন ডেলিভারি সুবিধা আছে। ১ বছরের অফিসিয়াল ওয়ারেন্টি।",
        "seller_chat_text": "কেটলির মূল্য ৯৫০ টাকা। ক্যাশ অন ডেলিভারি প্রযোজ্য। ঢাকার বাইরে কুরিয়ার চার্জ ১২০ টাকা অগ্রিম পরিশোধ করতে হবে। বাকি টাকা কুরিয়ারে দিবেন।",
        "expected": {
            "expected_price_ad": 950.0,
            "expected_price_chat": 950.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 120.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_22",
        "title": "Baby Diaper: Cash on Delivery Denied in Chat (Bangla Contradiction)",
        "category": "cod_denied",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "প্রিমিয়াম বেবি ডায়াপার প্যাক। মূল্য ১১০০ টাকা। সারা দেশে ক্যাশ অন ডেলিভারি সুবিধা। দ্রুত হোম ডেলিভারি।",
        "seller_chat_text": "ডায়াপারের দাম ১১০০ টাকা। কিন্তু আমাদের এখন ক্যাশ অন ডেলিভারি বন্ধ আছে, আপনাকে সম্পূর্ণ টাকা আগে বিকাশ করতে হবে।",
        "expected": {
            "expected_price_ad": 1100.0,
            "expected_price_chat": 1100.0,
            "expected_cod_ad": True,
            "expected_cod_chat": False,
            "expected_advance_required": True,
            "expected_advance_amount": 1100.0,
            "expected_advance_purpose": "FULL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["cod_availability"],
            "expected_payment_warnings": ["ADVANCE_FULL_PAYMENT", "COD_DENIED_OR_CONFLICT"]
        }
    },
    {
        "id": "frozen_23",
        "title": "Power Bank: Unspecified Advance in Chat (Banglish)",
        "category": "advance_unspecified",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "20000mAh Fast Charging Power Bank. Price 1650 taka. Cash on delivery available. 6 months warranty.",
        "seller_chat_text": "Power bank er dam 1650 tk bhaiya. Cash on delivery ache. Order er jonno 200 taka advance bkash korte hobe, baki taka delivery te.",
        "expected": {
            "expected_price_ad": 1650.0,
            "expected_price_chat": 1650.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 200.0,
            "expected_advance_purpose": "UNSPECIFIED",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_UNSPECIFIED_PURPOSE"]
        }
    },
    {
        "id": "frozen_24",
        "title": "Air Fryer: Warranty Denied in Chat (English Contradiction)",
        "category": "warranty_contradiction",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Digital Air Fryer 4.5L. Special offer 5500 BDT. Cash on delivery available. 1 year brand warranty included.",
        "seller_chat_text": "Price is 5500 BDT. Cash on delivery available. Please note at this discounted price there is no warranty provided.",
        "expected": {
            "expected_price_ad": 5500.0,
            "expected_price_chat": 5500.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["warranty"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_25",
        "title": "Silk Saree: Advance Booking Fee in Ad (Bangla)",
        "category": "advance_booking_fee",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "কাতান সিল্ক শাড়ি। মূল্য ৪২০০ টাকা। শাড়ি বুকিং করতে ৩০০ টাকা বুকিং ফি অগ্রিম বিকাশ করতে হবে। বাকি টাকা ক্যাশ অন ডেলিভারিতে।",
        "seller_chat_text": "শাড়ির দাম ৪২০০ টাকা। ক্যাশ অন ডেলিভারি পাবেন। ৩০০ টাকা বুকিং ফি অগ্রিম দিলে পার্সেল পাঠিয়ে দেব। বাকি ৩৯০০ কুরিয়ারে দেবেন।",
        "expected": {
            "expected_price_ad": 4200.0,
            "expected_price_chat": 4200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 300.0,
            "expected_advance_purpose": "BOOKING_FEE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_BOOKING_FEE"]
        }
    },
    {
        "id": "frozen_26",
        "title": "Hair Trimmer: Both Agree Complete Cash on Delivery (Banglish)",
        "category": "zero_advance_consistent",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Vintage T9 hair trimmer. Price 550 taka. Cash on delivery shara deshe. No advance payment needed.",
        "seller_chat_text": "Trimmer er dam 550 tk. Cash on delivery ache. Kono advance lagbe na bhaiya, parcel peye delivery man k full payment korben.",
        "expected": {
            "expected_price_ad": 550.0,
            "expected_price_chat": 550.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": False,
            "expected_advance_amount": 0.0,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_27",
        "title": "Bluetooth Neckband: Return Period Mismatch (Bangla Needs Review)",
        "category": "return_terms_mismatch",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "ওয়ানপ্লাস ব্লুটুথ নেকব্যান্ড। দাম ১২৫০ টাকা। ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি। ক্যাশ অন ডেলিভারি।",
        "seller_chat_text": "নেকব্যান্ডের দাম ১২৫০ টাকা। ক্যাশ অন ডেলিভারি আছে। সমস্যা হলে ৩ দিনের মধ্যে রিপ্লেসমেন্ট ক্লেইম করতে হবে।",
        "expected": {
            "expected_price_ad": 1250.0,
            "expected_price_chat": 1250.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_28",
        "title": "Sports Jersey: No Returns in Ad or Chat (Consistent Non-Refundable)",
        "category": "consistent_no_return",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "আর্জেন্টিনা ৩ স্টার ফ্যান জার্সি। মূল্য ৬৫০ টাকা। ক্যাশ অন ডেলিভারি। বিক্রি হওয়া পণ্য ফেরত নেই।",
        "seller_chat_text": "জার্সির দাম ৬৫০ টাকা। ক্যাশ অন ডেলিভারি পাবেন। সাইজ চার্ট দেখে নিবেন, বিক্রি হলে কোনো রিটার্ন হবে না ভাই।",
        "expected": {
            "expected_price_ad": 650.0,
            "expected_price_chat": 650.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": False,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["NO_RETURN_POLICY"]
        }
    },
    {
        "id": "frozen_29",
        "title": "Smart Watch Ultra: High Price Contradiction (Banglish)",
        "category": "price_contradiction",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Ultra Smart Watch with 7 straps combo. Special offer 1400 taka. Cash on delivery all BD.",
        "seller_chat_text": "Bhaiya eta premium model, price 2200 taka porbe. Cash on delivery paben. 1400 taka basic version er chilo.",
        "expected": {
            "expected_price_ad": 1400.0,
            "expected_price_chat": 2200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["price"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_30",
        "title": "Mini Hair Straightener: Missing Terms (Bangla Ad-Only)",
        "category": "ad_missing_terms",
        "language": "bangla",
        "mode": "ad_only",
        "advertisement_text": "পোর্টেবল মিনি হেয়ার স্ট্রেইটনার। দাম ৩৫০ টাকা। সহজে বহনযোগ্য ও দ্রুত গরম হয়। আজই অর্ডার করুন।",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 350.0,
            "expected_price_chat": None,
            "expected_cod_ad": None,
            "expected_cod_chat": None,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["cod", "delivery_charge", "return_policy"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_31",
        "title": "Leather Belt: Zero Advance in Ad (Bangla Ad-Only)",
        "category": "ad_zero_advance",
        "language": "bangla",
        "mode": "ad_only",
        "advertisement_text": "১০০% খাঁটি চামড়ার জেন্টস বেল্ট। অফার মূল্য ৬৫০ টাকা। সারা দেশে ফ্রি ক্যাশ অন ডেলিভারি। কোনো অগ্রিম ছাড়াই অর্ডার করুন।",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 650.0,
            "expected_price_chat": None,
            "expected_cod_ad": True,
            "expected_cod_chat": None,
            "expected_advance_required": False,
            "expected_advance_amount": 0.0,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["return_policy"],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_32",
        "title": "Gym Bag: Advance Delivery Charge (English)",
        "category": "advance_delivery_charge",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Waterproof Fitness Gym Bag. Price 1100 BDT. Cash on delivery available nationwide. 7 days exchange policy.",
        "seller_chat_text": "Price is 1100 BDT. Cash on delivery available. Please send 100 BDT courier delivery charge advance to confirm shipment.",
        "expected": {
            "expected_price_ad": 1100.0,
            "expected_price_chat": 1100.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 100.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_33",
        "title": "Lipstick Set: Partial Product Payment in Chat (Bangla)",
        "category": "advance_partial_payment",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "ম্যাট লিপস্টিক ১২ পিস কম্বো বক্স। অফার মূল্য ১২০০ টাকা। ক্যাশ অন ডেলিভারি সুবিধা আছে।",
        "seller_chat_text": "লিপস্টিক বক্স ১২০০ টাকা। ক্যাশ অন ডেলিভারি পাবেন। তবে পণ্যের মূল্যের অর্ধেক ৬০০ টাকা আংশিক পেমেন্ট অগ্রিম দিতে হবে। বাকি ৬০০ ডেলিভারিতে।",
        "expected": {
            "expected_price_ad": 1200.0,
            "expected_price_chat": 1200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 600.0,
            "expected_advance_purpose": "PARTIAL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_PARTIAL_PAYMENT"]
        }
    },
    {
        "id": "frozen_34",
        "title": "USB Microphone: Advance Delivery Fee (Banglish)",
        "category": "advance_delivery_charge",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Condenser USB Mic for streaming. Price 1800 taka. Cash on delivery available. 7 days replacement guarantee.",
        "seller_chat_text": "Bhai microphone er dam 1800 tk. Cash on delivery paben. Delivery fee 150 taka advance bkash korte hobe, baki taka delivery te.",
        "expected": {
            "expected_price_ad": 1800.0,
            "expected_price_chat": 1800.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 150.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_35",
        "title": "Smart Watch: COD Denied in Ad but Accepted in Chat (Bangla Concession)",
        "category": "cod_concession",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "ফিটনেস স্মার্ট ব্যান্ড। বিশেষ মূল্য ৯৫০ টাকা। ক্যাশ অন ডেলিভারি নেই, অগ্রিম পেমেন্টে ডেলিভারি ফ্রি।",
        "seller_chat_text": "দাম ৯৫০ টাকা ভাই। সমস্যা নেই আপনি চাইলে সম্পূর্ণ ক্যাশ অন ডেলিভারিতে নিতে পারেন।",
        "expected": {
            "expected_price_ad": 950.0,
            "expected_price_chat": 950.0,
            "expected_cod_ad": False,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_36",
        "title": "Wireless Earphones: No Warranty in Ad but Seller Agrees (Banglish Concession)",
        "category": "warranty_concession",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Budget TWS earbuds. Price 450 taka. Clearance stock, no warranty. Cash on delivery available.",
        "seller_chat_text": "Earbuds er price 450 tk. Cash on delivery paben. Apnar jonno 1 month service warranty dibo problem hole.",
        "expected": {
            "expected_price_ad": 450.0,
            "expected_price_chat": 450.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_37",
        "title": "Perfume: 100% Full Payment Required in Ad (Banglish Ad-Only)",
        "category": "ad_full_advance",
        "language": "banglish",
        "mode": "ad_only",
        "advertisement_text": "Dubai imported attar perfume combo. Price 1200 taka. 100% full advance payment bKash kore order confirm korte hobe.",
        "seller_chat_text": None,
        "expected": {
            "expected_price_ad": 1200.0,
            "expected_price_chat": None,
            "expected_cod_ad": None,
            "expected_cod_chat": None,
            "expected_advance_required": True,
            "expected_advance_amount": 1200.0,
            "expected_advance_purpose": "FULL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "missing_critical_fields": ["cod"],
            "expected_payment_warnings": ["ADVANCE_FULL_PAYMENT"]
        }
    },
    {
        "id": "frozen_38",
        "title": "Tripod Stand: Advance Booking Fee in Chat (Bangla)",
        "category": "advance_booking_fee",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "অ্যালুমিনিয়াম ক্যামেরা ট্রাইপড স্ট্যান্ড। মূল্য ৮৫০ টাকা। ক্যাশ অন ডেলিভারি সুবিধা আছে।",
        "seller_chat_text": "ট্রাইপডের দাম ৮৫০ টাকা। ক্যাশ অন ডেলিভারি হবে। তবে প্রোডাক্টটি হোল্ড করার জন্য ১০০ টাকা বুকিং ফি অগ্রিম দিতে হবে। বাকি টাকা ডেলিভারিতে।",
        "expected": {
            "expected_price_ad": 850.0,
            "expected_price_chat": 850.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 100.0,
            "expected_advance_purpose": "BOOKING_FEE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_BOOKING_FEE"]
        }
    },
    {
        "id": "frozen_39",
        "title": "Kitchen Knife Set: Consistent Free COD and 7 Days Replacement (Bangla)",
        "category": "consistent_safe",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "প্রফেশনাল শেফ নাইফ সেট ৬ পিস। অফার মূল্য ১৫৫০ টাকা। সারা দেশে ক্যাশ অন ডেলিভারি। ৭ দিনের রিপ্লেসমেন্ট সুবিধা। কোনো অগ্রিম ছাড়াই অর্ডার করুন।",
        "seller_chat_text": "নাইফ সেটের দাম ১৫৫০ টাকাই। ক্যাশ অন ডেলিভারি প্রযোজ্য। কোনো অগ্রিম লাগবে না, ডেলিভারি পাওয়ার পর চেক করে মূল্য পরিশোধ করবেন। কোনো ডিফেক্ট পেলে ৭ দিনের রিপ্লেসমেন্ট সুবিধা পাবেন।",
        "expected": {
            "expected_price_ad": 1550.0,
            "expected_price_chat": 1550.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": False,
            "expected_advance_amount": 0.0,
            "expected_advance_purpose": None,
            "expected_return_available": True,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": []
        }
    },
    {
        "id": "frozen_40",
        "title": "Kids Smart Watch: Advance Delivery Charge (English)",
        "category": "advance_delivery_charge",
        "language": "english",
        "mode": "ad_chat",
        "advertisement_text": "Kids GPS Tracking Smart Watch. Price 2100 BDT. Cash on delivery available. 1 year service warranty.",
        "seller_chat_text": "Hello, watch price is 2100 BDT. Cash on delivery is available. Please send 150 BDT delivery charge in advance to dispatch the parcel.",
        "expected": {
            "expected_price_ad": 2100.0,
            "expected_price_chat": 2100.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": True,
            "expected_advance_amount": 150.0,
            "expected_advance_purpose": "DELIVERY_CHARGE",
            "expected_return_available": None,
            "has_contradiction": False,
            "contradiction_fields": [],
            "expected_payment_warnings": ["ADVANCE_DELIVERY_CHARGE"]
        }
    },
    {
        "id": "frozen_41",
        "title": "Leather Boots: No Returns Explicit Denial in Chat (Banglish Contradiction)",
        "category": "return_contradiction",
        "language": "banglish",
        "mode": "ad_chat",
        "advertisement_text": "Pure leather ankle boots. Price 2800 taka. Cash on delivery available. 7 days easy return or replacement.",
        "seller_chat_text": "Bhaiya boot er dam 2800 tk. Cash on delivery paben. Stock clearance offer e kono return ba refund hobe na, all sales are final.",
        "expected": {
            "expected_price_ad": 2800.0,
            "expected_price_chat": 2800.0,
            "expected_cod_ad": True,
            "expected_cod_chat": True,
            "expected_advance_required": None,
            "expected_advance_amount": None,
            "expected_advance_purpose": None,
            "expected_return_available": False,
            "has_contradiction": True,
            "contradiction_fields": ["return_policy"],
            "expected_payment_warnings": ["NO_RETURN_POLICY"]
        }
    },
    {
        "id": "frozen_42",
        "title": "Winter Jacket: Multiple Discrepancies Price and COD (Bangla Contradiction)",
        "category": "multiple_contradictions",
        "language": "bangla",
        "mode": "ad_chat",
        "advertisement_text": "উইন্টার উইন্ডপ্রুফ জ্যাকেট। বিশেষ অফার মাত্র ১৬৫০ টাকা। সারা দেশে ফ্রি ক্যাশ অন ডেলিভারি। কোনো অগ্রিম লাগবে না।",
        "seller_chat_text": "জ্যাকেটের দাম এখন ২২০০ টাকা ভাই। আর ক্যাশ অন ডেলিভারি হবে না, পুরো ২২০০ টাকা আগে বিকাশ করতে হবে।",
        "expected": {
            "expected_price_ad": 1650.0,
            "expected_price_chat": 2200.0,
            "expected_cod_ad": True,
            "expected_cod_chat": False,
            "expected_advance_required": True,
            "expected_advance_amount": 2200.0,
            "expected_advance_purpose": "FULL_PRODUCT_PAYMENT",
            "expected_return_available": None,
            "has_contradiction": True,
            "contradiction_fields": ["price", "cod_availability"],
            "expected_payment_warnings": ["ADVANCE_FULL_PAYMENT", "COD_DENIED_OR_CONFLICT"]
        }
    }
]


def main():
    target_path = os.path.join(os.path.dirname(__file__), "..", "evaluation", "frozen_dataset.json")
    target_path = os.path.abspath(target_path)
    with open(target_path, "w", encoding="utf-8") as f:
        json.dump(SCENARIOS, f, ensure_ascii=False, indent=2)
    print(f"Successfully generated frozen benchmark dataset with {len(SCENARIOS)} scenarios at: {target_path}")


if __name__ == "__main__":
    main()
