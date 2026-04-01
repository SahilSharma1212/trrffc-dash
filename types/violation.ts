export interface Violation {
  id: string;
  track_id: string;
  vehicle_number: string;
  detected_at: string;
  location: string;
  helmet_status: string;
  complete_status: string;
  complete_image: string;
  date_folder: string;
  plate_image: string;
  status: string;
  reason: string | null;
  created_at: string;
}
