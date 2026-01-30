
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jezyrzobksvctwehjytx.supabase.co';
const supabaseAnonKey = 'sb_publishable_7LqueM4JhUGxnBG8PSUi9Q_Qm-23FOB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
