"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionCategory = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "CREDIT";
    TransactionType["DEBIT"] = "DEBIT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionCategory;
(function (TransactionCategory) {
    TransactionCategory["COIN_PURCHASE"] = "COIN_PURCHASE";
    TransactionCategory["GIFT_SENT"] = "GIFT_SENT";
    TransactionCategory["GIFT_RECEIVED"] = "GIFT_RECEIVED";
    TransactionCategory["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionCategory || (exports.TransactionCategory = TransactionCategory = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["APPROVED"] = "APPROVED";
    TransactionStatus["REJECTED"] = "REJECTED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
//# sourceMappingURL=transaction.enum.js.map