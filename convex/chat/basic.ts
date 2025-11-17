// See the docs at https://docs.convex.dev/agents/messages
import { components, internal } from "../_generated/api";
import { action, internalAction, mutation, query } from "../_generated/server";
import { listMessages, saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { fashionAgent as agent } from "../agents/fashion";
import { authorizeThreadAccess } from "../threads";
import { paginationOptsValidator } from "convex/server";

/**
 * OPTION 1 (BASIC):
 * Generating via a single action call
 */

export const generateTextInAnAction = action({
    args: { prompt: v.string(), threadId: v.string() },
    handler: async (ctx, { prompt, threadId }) => {
        await authorizeThreadAccess(ctx, threadId);
        const result = await agent.generateText(ctx, { threadId }, { prompt });
        return result.text;
    },
});

/**
 * OPTION 2 (RECOMMENDED):
 * Generating via a mutation & async action
 * This enables optimistic updates on the client.
 */

// Save a user message, and kick off an async response.
export const sendMessage = mutation({
    args: { 
        prompt: v.string(), 
        threadId: v.string(),
        context: v.optional(v.object({
            currentPage: v.optional(v.string()),
            userRole: v.optional(v.string()),
            userName: v.optional(v.string()),
        })),
    },
    handler: async (ctx, { prompt, threadId, context }) => {
        await authorizeThreadAccess(ctx, threadId);
        
        // Build enhanced prompt with context
        let enhancedPrompt = prompt;
        if (context) {
            const contextParts: string[] = [];
            if (context.currentPage) {
                contextParts.push(`Current page: ${context.currentPage}`);
            }
            if (context.userRole) {
                contextParts.push(`User role: ${context.userRole}`);
            }
            if (context.userName) {
                contextParts.push(`User name: ${context.userName}`);
            }
            if (contextParts.length > 0) {
                enhancedPrompt = `[Context: ${contextParts.join(", ")}]\n\n${prompt}`;
            }
        }
        
        const { messageId } = await saveMessage(ctx, components.agent, {
            threadId,
            prompt: enhancedPrompt,
        });
        await ctx.scheduler.runAfter(0, internal.chat.basic.generateResponse, {
            threadId,
            promptMessageId: messageId,
        });
    },
});

// Generate a response to a user message.
// Any clients listing the messages will automatically get the new message.
export const generateResponse = internalAction({
    args: { promptMessageId: v.string(), threadId: v.string() },
    handler: async (ctx, { promptMessageId, threadId }) => {
        await agent.generateText(ctx, { threadId }, { promptMessageId });
    },
});

// Equivalent:
// export const generateResponse = agent.asTextAction();

/**
 * Query & subscribe to messages & threads
 */

export const listThreadMessages = query({
    args: {
        threadId: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const { threadId, paginationOpts } = args;
        await authorizeThreadAccess(ctx, threadId);
        const messages = await listMessages(ctx, components.agent, {
            threadId,
            paginationOpts,
        });
        // You could add more fields here, join with other tables, etc.
        return messages;
    },
});