import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { DAPHost } from '@procode/dap-host';
import type { TrpcContext } from './trpc.js';

const t = initTRPC.context<TrpcContext>().create();

export const dapRouter = t.router({
  // Session management
  startSession: t.procedure
    .input(z.object({
      adapterPath: z.string(),
      config: z.object({
        type: z.enum(['launch', 'attach']),
        program: z.string(),
        args: z.array(z.string()).optional(),
        cwd: z.string().optional(),
        env: z.record(z.string()).optional(),
        stopOnEntry: z.boolean().optional(),
        console: z.enum(['internalConsole', 'integratedTerminal', 'externalTerminal']).optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.start(input.adapterPath, input.config);
      return { success: true };
    }),

  stopSession: t.procedure
    .mutation(async ({ ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.stop();
      return { success: true };
    }),

  getState: t.procedure
    .query(({ ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { state: 'stopped' };
      }

      return { state: dapHost.currentState };
    }),

  // Breakpoints
  setBreakpoints: t.procedure
    .input(z.object({
      path: z.string(),
      breakpoints: z.array(z.object({
        line: z.number(),
        column: z.number().optional(),
        condition: z.string().optional(),
        hitCondition: z.string().optional(),
        logMessage: z.string().optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      const result = await dapHost.setBreakpoints(input.path, input.breakpoints);
      return { breakpoints: result };
    }),

  clearBreakpoints: t.procedure
    .input(z.object({ path: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.clearBreakpoints(input.path);
      return { success: true };
    }),

  getBreakpoints: t.procedure
    .query(({ ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { breakpoints: new Map() };
      }

      return { breakpoints: dapHost.allBreakpoints };
    }),

  // Execution control
  continue: t.procedure
    .input(z.object({ threadId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      const allThreadsContinued = await dapHost.continue(input.threadId);
      return { allThreadsContinued };
    }),

  next: t.procedure
    .input(z.object({ threadId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.next(input.threadId);
      return { success: true };
    }),

  stepIn: t.procedure
    .input(z.object({ threadId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.stepIn(input.threadId);
      return { success: true };
    }),

  stepOut: t.procedure
    .input(z.object({ threadId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.stepOut(input.threadId);
      return { success: true };
    }),

  pause: t.procedure
    .input(z.object({ threadId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      await dapHost.pause(input.threadId);
      return { success: true };
    }),

  // Threads
  getThreads: t.procedure
    .query(async ({ ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { threads: [] };
      }

      const threads = await dapHost.getThreads();
      return { threads };
    }),

  // Stack trace
  getStackTrace: t.procedure
    .input(z.object({
      threadId: z.number().optional(),
      startFrame: z.number().default(0),
      levels: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { stackFrames: [] };
      }

      const stackFrames = await dapHost.getStackTrace(input.threadId, input.startFrame, input.levels);
      return { stackFrames };
    }),

  // Variables
  getScopes: t.procedure
    .input(z.object({ frameId: z.number() }))
    .query(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { scopes: [] };
      }

      const scopes = await dapHost.getScopes(input.frameId);
      return { scopes };
    }),

  getVariables: t.procedure
    .input(z.object({ variablesReference: z.number() }))
    .query(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        return { variables: [] };
      }

      const variables = await dapHost.getVariables(input.variablesReference);
      return { variables };
    }),

  // Evaluate
  evaluate: t.procedure
    .input(z.object({
      expression: z.string(),
      frameId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dapHost = ctx.dapHost;
      if (!dapHost) {
        throw new Error('DAP Host not initialized');
      }

      const result = await dapHost.evaluate(input.expression, input.frameId);
      return { result: result.result, type: result.type, variablesReference: result.variablesReference };
    }),
});
