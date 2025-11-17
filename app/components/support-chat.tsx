import { Button } from "~/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from 'components/ai-elements/conversation';
import { Message, MessageAvatar, MessageContent } from 'components/ai-elements/message';
import { Dog, MessageSquare, Loader2 } from "lucide-react";
import {
    PromptInput,
    PromptInputBody,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
} from 'components/ai-elements/prompt-input';

import { api } from "convex/_generated/api";
import { toUIMessages } from "@convex-dev/agent";
import { optimisticallySendMessage, useThreadMessages } from "@convex-dev/agent/react";
import { useMutation } from "convex/react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router";

interface SupportChatProps {
    user?: {
        firstName?: string;
        lastName?: string;
        role?: string;
        profilePicture?: string;
    } | null;
}

export function SupportChat({ user }: SupportChatProps) {
    const location = useLocation();
    const [threadId, setThreadId] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const createThread = useMutation(api.threads.createNewThread);

    // Get current page name from location
    const currentPage = useMemo(() => {
        const path = location.pathname;
        if (path === "/") return "Home";
        if (path.startsWith("/therapist")) {
            if (path === "/therapist" || path === "/therapist/") return "Therapist Dashboard";
            if (path.includes("/profile")) return "Therapist Profile";
            if (path.includes("/children-list")) return "Children List";
            if (path.includes("/process-charts")) return "Process Charts";
            if (path.includes("/calendar")) return "Calendar";
            if (path.includes("/create-report")) return "Create Report";
            if (path.includes("/reports")) return "Reports";
            return "Therapist Page";
        }
        if (path.startsWith("/parent")) {
            if (path === "/parent" || path === "/parent/") return "Parent Dashboard";
            if (path.includes("/profile")) return "Parent Profile";
            if (path.includes("/assessments")) return "Assessments";
            if (path.includes("/progress")) return "Progress Charts";
            if (path.includes("/faq")) return "FAQ";
            return "Parent Page";
        }
        return "Unknown Page";
    }, [location.pathname]);

    // Create thread with context on mount
    useEffect(() => {
        if (!threadId && !isCreatingThread) {
            setIsCreatingThread(true);
            const create = async () => {
                try {
                    const context = {
                        currentPage,
                        userRole: user?.role,
                        userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : undefined,
                    };
                    const newThreadId = await createThread({ context });
                    setThreadId(newThreadId);
                } catch (error) {
                    console.error("Failed to create thread:", error);
                } finally {
                    setIsCreatingThread(false);
                }
            };
            void create();
        }
    }, [threadId, createThread, currentPage, user, isCreatingThread]);

    // Get messages
    const messages = useThreadMessages(
        api.chat.basic.listThreadMessages,
        threadId ? { threadId } : "skip",
        { initialNumItems: 100 },
    );

    const sendMessage = useMutation(
        api.chat.basic.sendMessage,
    ).withOptimisticUpdate(
        optimisticallySendMessage(api.chat.basic.listThreadMessages),
    );

    const onSendClicked = () => {
        if (!threadId || prompt.trim() === "") return;

        const currentPrompt = prompt;
        setPrompt("");
        
        const context = {
            currentPage,
            userRole: user?.role,
            userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : undefined,
        };
        
        void sendMessage({ 
            threadId, 
            prompt: currentPrompt.trim(),
            context,
        }).catch(() => {
            setPrompt(currentPrompt);
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSendClicked();
        }
    };

    // Get user display name and avatar
    const userName = user 
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "You"
        : "You";
    
    const userAvatar = user?.profilePicture 
        ? `${import.meta.env.VITE_CONVEX_URL}/api/storage/${user.profilePicture}`
        : undefined;

    // Check if there's a pending AI response (last message is from user and no assistant response yet)
    const uiMessages = toUIMessages(messages.results ?? []);
    const lastMessage = uiMessages[uiMessages.length - 1];
    const lastResultIndex = messages.results?.findIndex(msg => msg.id === lastMessage?.id) ?? -1;
    const hasAssistantResponseAfter = messages.results?.slice(lastResultIndex + 1).some(m => m.role === "assistant") ?? false;
    const isWaitingForResponse = lastMessage?.role === "user" && !hasAssistantResponseAfter;

    return (
        <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="noShadow" className="shadow-lg rounded-full size-14">
                        <Dog className="size-8" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent sideOffset={16}
                                className="w-[calc(100vw-32px)] bg-background md:w-96 mx-4 max-h-[85vh] flex flex-col p-0 overflow-hidden">
                    <div className="flex flex-col h-full min-h-0 p-4">
                        <div className="mb-2 pb-2 border-b flex-shrink-0">
                            <h3 className="font-semibold text-sm">Chat with Buddy</h3>
                            <p className="text-xs text-muted-foreground">Your Emo-Kids support assistant</p>
                        </div>
                        <Conversation className="relative w-full flex-1 min-h-0 overflow-hidden">
                            <ConversationContent>
                                {isCreatingThread || !threadId ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                            <p className="text-sm text-muted-foreground">Starting conversation...</p>
                                        </div>
                                    </div>
                                ) : messages.results?.length === 0 ? (
                                    <ConversationEmptyState
                                        icon={<MessageSquare className="size-12" />}
                                        title="Hello!"
                                        description="I'm Buddy, your support assistant. How can I help you today?"
                                    />
                                ) : (
                                    <>
                                        {uiMessages.map((message) => (
                                            <Message from={message.role} key={message.id}>
                                                <MessageContent>{message.text}</MessageContent>
                                                <MessageAvatar 
                                                    src={message.role === 'user' ? userAvatar : undefined}
                                                    name={message.role === 'user' ? userName : 'Buddy'}
                                                    icon={message.role === 'assistant' ? <Dog className="h-5 w-5 text-rose-600 dark:text-rose-400" /> : undefined}
                                                />
                                            </Message>
                                        ))}
                                        {isWaitingForResponse && (
                                            <Message from="assistant">
                                                <MessageContent>
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                        <span className="text-muted-foreground text-sm">Buddy is thinking...</span>
                                                    </div>
                                                </MessageContent>
                                                <MessageAvatar 
                                                    name="Buddy"
                                                    icon={<Dog className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                                                />
                                            </Message>
                                        )}
                                    </>
                                )}
                            </ConversationContent>
                            <ConversationScrollButton />
                        </Conversation>
                        <PromptInput onSubmit={onSendClicked} className="mt-4 relative flex-shrink-0">
                            <PromptInputBody>
                                <PromptInputTextarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ask a question..."
                                    onKeyDown={handleKeyDown}
                                    disabled={!threadId || isCreatingThread}
                                />
                            </PromptInputBody>
                            <PromptInputToolbar>
                                <PromptInputSubmit
                                    disabled={prompt.trim() === "" || !threadId || isCreatingThread}
                                />
                            </PromptInputToolbar>
                        </PromptInput>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}