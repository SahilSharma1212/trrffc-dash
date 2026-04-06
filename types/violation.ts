export interface Violation {
  id: string;
  track_id: string;
  vehicle_number: string;
  detected_at: string;
  location: string;
  helmet_status: string;
  complete_status: string;
  complete_image_b64: string | null;
  date_folder: string;
  plate_image_b64: string | null;
  status: string;
  reason: string | null;
  created_at: string;
  challan: boolean | null;
}
