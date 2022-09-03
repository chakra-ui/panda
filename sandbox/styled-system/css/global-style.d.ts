
    import { Properties } from '../types/csstype'
    
    export type GlobalStyles = Record<string, Properties>
    
    export declare function globalStyle(styles: GlobalStyles): void;
    