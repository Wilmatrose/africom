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
exports.TournamentsController = void 0;
const common_1 = require("@nestjs/common");
const tournaments_service_1 = require("./tournaments.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TournamentsController = class TournamentsController {
    constructor(tournamentsService) {
        this.tournamentsService = tournamentsService;
    }
    async getAll() {
        return this.tournamentsService.getTournaments();
    }
    async create(body, req) {
        return this.tournamentsService.createTournament(req.user.id, body.title, body.bracketUrl, body.fee);
    }
    async join(body, req) {
        return this.tournamentsService.joinTournament(body.tournamentId, req.user.id);
    }
    async startTournament(id, req) {
        return this.tournamentsService.startTournament(id, req.user.id);
    }
    async endTournament(id, body, req) {
        return this.tournamentsService.endTournament(id, req.user.id, body.winnerId);
    }
    async getMessages(groupId) {
        return this.tournamentsService.getMessages(groupId);
    }
    async sendMessage(body, req) {
        return this.tournamentsService.sendMessage(body.groupId, req.user.id, req.user.username, body.content);
    }
};
exports.TournamentsController = TournamentsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getAll", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "join", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "startTournament", null);
__decorate([
    (0, common_1.Patch)(':id/end'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "endTournament", null);
__decorate([
    (0, common_1.Get)('messages/:groupId'),
    __param(0, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('message'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TournamentsController.prototype, "sendMessage", null);
exports.TournamentsController = TournamentsController = __decorate([
    (0, common_1.Controller)('tournaments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tournaments_service_1.TournamentsService])
], TournamentsController);
//# sourceMappingURL=tournaments.controller.js.map