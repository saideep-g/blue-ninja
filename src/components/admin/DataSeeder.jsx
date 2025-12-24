//This component maps your JSON structure to the Firestore schema required by the **v4.0 Developer Spec**.
import React, { useState } from 'react';
import { db } from '../../firebase/config';
import { doc, setDoc, collection } from 'firebase/firestore';
import curriculumData from '../../data/curriculum.json';
import questionData from '../../data/diagnostic-questions-v4.0.json';

/**
* DataSeeder: The Knowledge Bridge
* This component pushes the JSON data into Firestore.
* It maps Atomic Concepts and Diagnostic Missions to the cloud.
*/
function DataSeeder() {
    const [status, setStatus] = useState('Idle');

    const seedDatabase = async () => {
        setStatus('Seeding... 🚀');
        try {
            // 1. Seed the Curriculum (Modules & Atoms)
            for (const module of curriculumData.modules) {
                // Create a record for each Atom within the module
                for (const atom of module.atoms) {
                    const atomRef = doc(db, 'atomic_concepts', atom.id);
                    await setDoc(atomRef, {
                        ...atom,
                        module_id: module.module_id,
                        module_name: module.name,
                        power_max: 75, // As per v4.0 Spec
                        last_updated: new Date().toISOString()
                    });
                }
            }

            // 2. Seed the Diagnostic Questions
            for (const q of questionData.questions) {
                const qRef = doc(db, 'diagnostic_questions', q.id);
                await setDoc(qRef, {
                    ...q,
                    is_active: true,
                    created_at: new Date().toISOString()
                });
            }

            setStatus('Seeding Complete! Blue Ninja is now smart. ✨');
        } catch (error) {
            console.error("Seeding failed:", error);
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div className="ninja-card mt-8 p-6 bg-blue-50 border-2 border-dashed border-blue-200">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Knowledge Seeder</h3>
            <p className="text-sm text-blue-700 mb-4">
                Click below to upload the {curriculumData.total_modules} modules and
                {questionData.test_metadata.total_questions} mission questions to Firestore.
            </p>
            <button
                onClick={seedDatabase}
                className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all"
            >
                {status}
            </button>
        </div>
    );
}

export default DataSeeder;