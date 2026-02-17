import React, { createContext, useContext, useState, useEffect } from 'react';
import { T } from '../globals';

const OrganizationContext = createContext();

export const useOrganization = () => {
    const context = useContext(OrganizationContext);
    if (!context) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
};

const MOCK_ORGS = [
    { id: 'org_civic_1', name: 'Civic Futures Foundation', type: 'non_profit', role: 'admin' },
    { id: 'org_edc_2', name: 'Metro Economic Alliance', type: 'edc', role: 'viewer' }
];

export const OrganizationProvider = ({ children }) => {
    // "personal" or an org object
    const [activeContext, setActiveContext] = useState("personal");
    const [userOrgs, setUserOrgs] = useState(MOCK_ORGS);

    const switchContext = (contextId) => {
        if (contextId === "personal") {
            setActiveContext("personal");
        } else {
            const org = userOrgs.find(o => o.id === contextId);
            if (org) setActiveContext(org);
        }
    };

    const createOrg = (newOrg) => {
        const orgWithId = { ...newOrg, id: `org_${Date.now()}`, role: 'admin' };
        setUserOrgs([...userOrgs, orgWithId]);
        setActiveContext(orgWithId);
        return orgWithId;
    };

    const value = {
        activeContext,
        userOrgs,
        switchContext,
        createOrg,
        isPersonal: activeContext === "personal"
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
};
