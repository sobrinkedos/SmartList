import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Supabase
// Substitua estes valores pelas suas credenciais reais do Supabase
const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMDY2Mjk0Niwic3ViIjoiYW5vbiJ9.exampleKeyForDemonstrationPurposes';

// Criar cliente do Supabase com suporte para AsyncStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Inicializa o Supabase
 */
export const initializeSupabase = async () => {
  try {
    // Verificar conexão com o Supabase
    const { data, error } = await supabase.from('_connection_test_').select('*').limit(1);
    
    if (error) throw error;
    
    console.log('Supabase inicializado com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    return { success: false, error };
  }
};

/**
 * Verifica se o dispositivo está conectado ao Supabase
 */
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('_connection_test_').select('*').limit(1);
    
    if (error) throw error;
    
    return { connected: true };
  } catch (error) {
    console.warn('Dispositivo offline ou erro de conexão com Supabase:', error);
    return { connected: false, error };
  }
};

/**
 * Retorna o cliente do Supabase
 */
export const getSupabase = () => supabase;

/**
 * Retorna o cliente de autenticação do Supabase
 */
export const getAuth = () => supabase.auth;

/**
 * Retorna o cliente de banco de dados do Supabase
 */
export const getDatabase = () => supabase;

/**
 * Retorna o cliente de armazenamento do Supabase
 */
export const getStorage = () => supabase.storage;