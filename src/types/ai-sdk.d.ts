import "ai";

declare module "ai" {
    interface ChatInit<UI_MESSAGE extends UIMessage = UIMessage> {
        api?: string;
        metadata?: Record<string, any>;
        body?: Record<string, any>;
    }

    interface UIMessage {
        createdAt?: Date;
        type?: string;
        text?: string;
        content?: string;
        command?: string;
        toolInvocations?: any[];
    }

    // Adding missing properties to the options of AI SDK functions
    export interface StepSettings {
        maxSteps?: number;
        maxToolRoundtrips?: number;
    }
}
