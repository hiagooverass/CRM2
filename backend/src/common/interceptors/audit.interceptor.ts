import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    return next.handle().pipe(
      tap(async () => {
        if (method !== 'GET') {
          await this.prisma.log.create({
            data: {
              userId: user?.id || null,
              action: method,
              module: url,
              details: JSON.stringify(request.body),
            },
          });
        }
      }),
    );
  }
}
