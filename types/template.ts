export interface LabelOnWebThDto {
  label: string;
  description?: string;
}

export interface DateDto {
  start_date: string;
  end_date: string;
  description?: string;
}

export interface TemplateContentDto {
  no: number;
  sequence: number;
  label_on_web_th: LabelOnWebThDto;
  label_on_web_en: string;
  application_form_status: string;
  date: DateDto;
  current_stage: 'Yes' | 'No';
  export: boolean;
}

export interface CreateTemplateDto {
  title: string;
  contents: TemplateContentDto[];
}