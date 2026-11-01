import { Injectable } from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminUsuariosService } from './admin-usuarios.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly usuariosService: AdminUsuariosService,
  ) {}
}
