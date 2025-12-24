import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNinja } from '../../context/NinjaContext';

/**
 * ConceptPowerMap: Step 14 Implementation
 * Visualizes the 13 math modules as unlockable power nodes.
 * Framed as a "Mission Map" rather than a curriculum list.
 */
function ConceptPowerMap({ masteryData }) {
    const [modules, setModules] = useState([]);
    const { ninjaStats } = useNinja();

    // Load modules to build the map structure
    useEffect(() => {
        const fetchModules = async () => {
            // In a production app, you might fetch this from a 'curriculum' collection
            // For this phase, we group the seeded atomic_concepts
            const atomsSnap = await getDocs(collection(db, 'atomic_concepts'));
            const atoms = atomsSnap.docs.map(doc => doc.data());

            const grouped = atoms.reduce((acc, atom) => {
                if (!acc[atom.module_id]) {
                    acc[atom.module_id] = {
                        id: atom.module_id,
                        name: atom.module_name,
                        atoms: []
                    };
                }
                acc[atom.module_id].atoms.push(atom);
                return acc;
            }, {});

            setModules(Object.values(grouped).sort((a, b) => a.id.localeCompare(b.id)));
        };
        fetchModules();
    }, []);

    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">
                    🗺️ Concept Power Map
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {modules.length} Modules Discovered
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((mod) => {
                    // Calculate average power for the module
                    const modulePower = mod.atoms.reduce((sum, atom) => {
                        const score = masteryData[atom.id] || 0;
                        return sum + Math.round(score * 75);
                    }, 0);

                    const maxPower = mod.atoms.length * 75;
                    const isLocked = modulePower === 0 && mod.id !== 'M1';

                    return (
                        <div
                            key={mod.id}
                            className={`ninja-card transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : 'hover:scale-[1.02] border-blue-100'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                        {mod.id}
                                    </span>
                                    <h4 className="text-xl font-black text-blue-800 italic leading-none mt-1 uppercase">
                                        {mod.name}
                                    </h4>
                                </div>
                                {isLocked ? (
                                    <span className="text-xl">🔒</span>
                                ) : (
                                    <div className="text-right">
                                        <div className="text-lg font-black text-blue-600 leading-none">{modulePower}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase">Power</div>
                                    </div>
                                )}
                            </div>

                            {/* Module Progress Bar */}
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000"
                                    style={{ width: `${(modulePower / maxPower) * 100}%` }}
                                />
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {mod.atoms.map(atom => (
                                    <div
                                        key={atom.id}
                                        title={atom.name}
                                        className={`w-2 h-2 rounded-full ${(masteryData[atom.id] || 0) > 0.8 ? 'bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,1)]' :
                                            (masteryData[atom.id] || 0) > 0.4 ? 'bg-blue-400' : 'bg-slate-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ConceptPowerMap;