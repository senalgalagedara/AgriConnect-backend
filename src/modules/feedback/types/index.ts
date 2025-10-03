// Feedback Types
export type FeedbackType = 'user-experience' | 'performance' | 'product-service' | 'transactional';

export interface FeedbackData {
    feedback_id?: string;
    user_id?: string;
    rating: number;
    comment: string;
    feedback_type: FeedbackType;
    meta?: Record<string, any>;
    title?: string;
    subtitle?: string;
    status?: 'active' | 'hidden' | 'archived';
    created_at?: Date;
    updated_at?: Date;
}

// Request/Response interfaces
export interface CreateFeedbackRequest {
    rating: number;
    comment: string;
    feedback_type: FeedbackType;
    meta?: Record<string, any>;
    title?: string;
    subtitle?: string;
}

export interface UpdateFeedbackRequest {
    rating?: number;
    comment?: string;
    feedback_type?: FeedbackType;
    meta?: Record<string, any>;
    title?: string;
    subtitle?: string;
    status?: 'active' | 'hidden' | 'archived';
}

export interface FeedbackResponse extends FeedbackData {
    feedback_id: string;
    created_at: Date;
    updated_at: Date;
}

export interface FeedbackQueryOptions {
    user_id?: string;
    feedback_type?: FeedbackType;
    status?: 'active' | 'hidden' | 'archived';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}

export interface FeedbackSummary {
    total_count: number;
    average_rating: number;
    feedback_types: {
        [key in FeedbackType]?: number;
    };
    status_counts: {
        active: number;
        hidden: number;
        archived: number;
    };
}