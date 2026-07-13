import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    const start = Date.now();
    const userInfo = () =>
      request.user ? ` user=${request.user.sub}(${request.user.role})` : '';

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${originalUrl} ${response.statusCode} +${duration}ms${userInfo()}`,
        );
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const status = err?.status ?? 500;
        this.logger.warn(
          `${method} ${originalUrl} ${status} +${duration}ms${userInfo()} — ${err?.message ?? 'Erreur inconnue'}`,
        );
        throw err;
      }),
    );
  }
}
