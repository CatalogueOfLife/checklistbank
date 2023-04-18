
import React, { useEffect } from "react"
import withContext from "../../components/hoc/withContext";
import Auth from "../../components/Auth";
import { NavLink } from "react-router-dom";

const DatasetNavLink = ({ user, text, record }) => {

    useEffect(() => { }, [user])
    return <NavLink
        to={{ pathname: (record.origin === 'project' && Auth.canViewDataset(record, user)) ? `/catalogue/${record.key}/metadata` : `/dataset/${record.key}/about` }}
        exact={true}
    >
        {text}
    </NavLink>
}

const mapContextToProps = ({
    user
}) => ({ user });

export default withContext(mapContextToProps)(DatasetNavLink);