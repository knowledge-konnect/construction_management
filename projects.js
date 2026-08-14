import { supabase } from './supabaseClient';

/**
 * Fetches all projects from the database.
 * This is a simplified example based on the API patterns
 * in your project's dependencies.
 */
export async function getProjects() {
    try {
        // Supabase client returns data and error
        const { data, error } = await supabase.from('projects').select('*');

        if (error) throw error;

        return { data, error: null };
    } catch (error) {
        console.error('Error fetching projects:', error);
        return { data: null, error };
    }
}
