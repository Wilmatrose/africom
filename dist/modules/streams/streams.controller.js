"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamsController = void 0;
const common_1 = require("@nestjs/common");
const streams_service_1 = require("./streams.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let StreamsController = class StreamsController {
    constructor(streamsService) {
        this.streamsService = streamsService;
    }
    async getLiveStreams() {
        return this.streamsService.getActiveStreams();
    }
    async getAllActiveStreams() {
        return this.streamsService.getActiveStreams();
    }
    async startStream(req, body) {
        const creatorId = req.user.userId;
        const creatorName = req.user.username;
        return this.streamsService.startSession(creatorId, body.platform, body.platformStreamId, body.title, creatorName);
    }
    async endStream(id, req) {
        return this.streamsService.endSession(id);
    }
    async getManagerData(sessionId) {
        return this.streamsService.getStreamForManager(sessionId);
    }
};
exports.StreamsController = StreamsController;
__decorate([
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getLiveStreams", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getAllActiveStreams", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "startStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('end/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "endStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('manager/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getManagerData", null);
exports.StreamsController = StreamsController = __decorate([
    (0, common_1.Controller)('streams'),
    __metadata("design:paramtypes", [streams_service_1.StreamsService])
], StreamsController);
//# sourceMappingURL=streams.controller.js.map