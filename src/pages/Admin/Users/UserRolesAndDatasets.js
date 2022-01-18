import React, { useState, useEffect } from "react";

const UserRolesAndDatasets = ({ user }) => {
  const PAGE_SIZE = 25;
  const [type, setType] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [q, setQ] = useState(null);
  const [pagination, setPagination] = useState({
    pageSize: PAGE_SIZE,
    current: 1,
  });
  useEffect(() => {
    if (user?.editor) {
      setType("editor");
      getData(type);
    }
  }, [user]);

  const getData = async (paging) => {
    const limit = data?.limit || PAGE_SIZE;
    const offset = data?.offset || 0;
    const offset = (paging.current - 1) * (data?.limit || PAGE_SIZE) || 0;
    const limit = data?.limit || PAGE_SIZE;
    setPagination({ ...pagination, current });

    setLoading(true);
    const res = await axios(
      `${config.dataApi}dataset?${
        q ? "q=" + encodeURIComponent(q) : ""
      }&offset=${offset}&limit=${limit}&${type}=${user.key}`
    );

    setData(res.data);
    setPagination({ ...pagination, total: res.data.total });
    setLoading(false);
  };

  return (
    <Table
      style={{ marginTop: "10px" }}
      size="middle"
      columns={columns}
      dataSource={data?.result || []}
      loading={loading}
      onChange={getData}
      pagination={pagination}
    />
  );
};
