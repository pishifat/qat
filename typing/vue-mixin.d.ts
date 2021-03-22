import Vue from 'vue';
import moment from 'moment';
import MarkdownIt from 'markdown-it';

declare module 'vue/types/vue' {
    interface Vue {
        $moment: typeof moment;
        $md: MarkdownIt;
        $http: {
            initialRequest<T>(url: string): Promise<T | { error: string }>;
            executeGet<T>(url: string, event?, updateLoadingState?: boolean): Promise<T | { error: string }>;
            executePost<T>(path: string, data?: Record<string, any>, event?): Promise<T | { error: string }>;
            isValid<T>(data: any): boolean;
        };
    }
}
