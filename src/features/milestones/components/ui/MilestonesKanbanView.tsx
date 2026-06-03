import React from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { milestonesService } from '@/features/milestones/api/milestones.api';
import { Badge } from '@/components/data-display/Badge';
import { Calendar, Hash } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const ITEM_TYPE = 'MILESTONE_CARD';

interface Milestone {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    flags?: string;
    project_id: number;
}

interface MilestonesKanbanViewProps {
    milestones: Milestone[];
    onUpdate: () => void;
}

interface KanbanCardProps {
    milestone: Milestone;
}

function KanbanCard({ milestone }: KanbanCardProps) {
    const navigate = useNavigate();
    const [{ isDragging }, dragRef] = useDrag({
        type: ITEM_TYPE,
        item: { id: milestone.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    return (
        <div
            ref={dragRef as any}
            onClick={() => navigate(`/milestones/${milestone.id}/edit`)}
            className={`bg-white p-4 rounded-lg border shadow-sm mb-3 transition-all cursor-pointer hover:border-teal-400 hover:shadow-md ${isDragging ? 'opacity-50 grayscale' : 'opacity-100'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5 text-[#6B7280]">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-mono">MLS-{milestone.id}</span>
                </div>
                <Badge value={milestone.flags || 'Internal'} variant="status" />
            </div>
            <h4 className="text-[14px] font-semibold text-[#1F2937] mb-3 line-clamp-2">
                {milestone.title}
            </h4>
            <div className="flex items-center gap-2 text-[#6B7280] mt-auto pt-2 border-t border-gray-50">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[12px]">{milestone.end_date || 'No end date'}</span>
            </div>
        </div>
    );
}

interface KanbanColumnProps {
    flag: string;
    milestones: Milestone[];
    onDrop: (milestoneId: number, flag: string) => void;
}

function KanbanColumn({ flag, milestones, onDrop }: KanbanColumnProps) {
    const [{ isOver }, dropRef] = useDrop({
        accept: ITEM_TYPE,
        drop: (item: { id: number }) => onDrop(item.id, flag),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={dropRef as any}
            className={`flex-shrink-0 w-80 flex flex-col rounded-xl bg-[#F9FAFB] border border-gray-100 p-4 min-h-[500px] transition-colors ${isOver ? 'bg-[#f0fdfa] ring-2 ring-[#14b8a6] ring-inset' : ''
                }`}
        >
            <div className="flex items-center gap-2 mb-4 px-1">
                <h3 className="font-bold text-[#374151] text-[15px] uppercase tracking-wider">{flag}</h3>
                <span className="bg-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {milestones.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {milestones.map((ms) => (
                    <KanbanCard key={ms.id} milestone={ms} />
                ))}
                {milestones.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm italic">
                        No milestones here
                    </div>
                )}
            </div>
        </div>
    );
}

export function MilestonesKanbanView({ milestones, onUpdate }: MilestonesKanbanViewProps) {
    const flags = ['Internal', 'External'];

    const handleDrop = async (milestoneId: number, flag: string) => {
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex gap-6 overflow-x-auto p-2 min-h-full h-full">
                {flags.map((f) => (
                    <KanbanColumn
                        key={f}
                        flag={f}
                        milestones={milestones.filter((m) => (m.flags || 'Internal') === f)}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
        </DndProvider>
    );
}
