import Vue from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        initialRequest<T>(url: string, event?): Promise<T | { error: string }>;
        executeGet<T>(url: string, event?, updateLoadingState?: boolean): Promise<T | { error: string }>;
        executePost<T>(url: string, data?: object, event?): Promise<T | { error: string }>;
    }
}
