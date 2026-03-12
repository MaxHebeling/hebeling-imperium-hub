export interface EditorialAiSuggestion {
  id: string;
  project_id: string;
  file_id: string | null;
  paragraph_index: number;
  original_text: string;
  suggested_text: string;
  applied: boolean;
  created_at: string;
  updated_at: string;
}
