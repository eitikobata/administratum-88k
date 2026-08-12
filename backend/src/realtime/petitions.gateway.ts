import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PETITION_UPDATED_EVENT } from './realtime.constants';

interface PetitionUpdatedPayload {
  petitionId: string;
  fromState: string;
  toState: string;
  reason?: string;
}

// The bridge between the domain (PetitionWorkflowService, which has no idea
// this class exists) and every browser tab that has the dashboard open.
// It never touches Prisma or business logic — its only job is "an event
// happened internally, tell everyone connected".
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL?.split(',') ?? '*' },
})
export class PetitionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PetitionsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Fires whenever PetitionWorkflowService.transitionTo() emits internally.
  // Re-broadcasting under the same event name keeps things simple: the
  // frontend listens for 'petition.updated' and doesn't need to know it's
  // actually two hops (EventEmitter2 -> this gateway -> Socket.IO).
  @OnEvent(PETITION_UPDATED_EVENT)
  handlePetitionUpdated(payload: PetitionUpdatedPayload) {
    this.server.emit(PETITION_UPDATED_EVENT, payload);
  }
}
