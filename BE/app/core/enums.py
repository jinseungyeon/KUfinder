from enum import StrEnum


class ItemCategory(StrEnum):
    WALLET = "WALLET"
    PHONE = "PHONE"
    ELECTRONICS = "ELECTRONICS"
    CARD = "CARD"
    KEY = "KEY"
    BAG = "BAG"
    CLOTHING = "CLOTHING"
    UMBRELLA = "UMBRELLA"
    STATIONERY = "STATIONERY"
    ACCESSORY = "ACCESSORY"
    OTHER = "OTHER"


CATEGORY_LABELS = {
    ItemCategory.WALLET: "지갑",
    ItemCategory.PHONE: "스마트폰",
    ItemCategory.ELECTRONICS: "전자기기",
    ItemCategory.CARD: "카드/학생증",
    ItemCategory.KEY: "열쇠",
    ItemCategory.BAG: "가방",
    ItemCategory.CLOTHING: "의류",
    ItemCategory.UMBRELLA: "우산",
    ItemCategory.STATIONERY: "문구류",
    ItemCategory.ACCESSORY: "액세서리",
    ItemCategory.OTHER: "기타",
}
