'use client';

import React from 'react';
import {AlertCircle , X} from 'lucide-react';

interface SaveChangesNodalProps{
    isOpen : boolean;
    title : string;
    message: string;
    onConfirm: () => void ; 
    onCancel: () => void;
    isLoading?: boolean;
}

export const SaveChangesNodal: React.FC<SaveChangesNodalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    isLoading = false,
}) => {
    if (!isOpen) return null;

    return(
        <div className = "fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className ="absolute inset-0 bg-black/50" onClick={onCancel}>
                <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">

                </div>
            </div>

        </div>
    );
};