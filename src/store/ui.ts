import { create } from "zustand";
type UIStore = { lessonSearch: string; favoritesOnly: boolean; setLessonSearch: (value: string) => void; toggleFavorites: () => void };
export const useUIStore = create<UIStore>(set => ({ lessonSearch: "", favoritesOnly: false, setLessonSearch: lessonSearch => set({ lessonSearch }), toggleFavorites: () => set(s => ({ favoritesOnly: !s.favoritesOnly })) }));
