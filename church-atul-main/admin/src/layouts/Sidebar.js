import { Button, Nav, NavItem } from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const Sidebar = () => {
  const sidebarRef = useRef(null); // Reference for the sidebar
  const location = useLocation();

  const showMobilemenu = () => {
    document.getElementById("sidebarArea").classList.toggle("showSidebar");
  };

  const closeSidebar = () => {
    const sidebarArea = document.getElementById("sidebarArea");
    if (sidebarArea?.classList.contains("showSidebar")) {
      sidebarArea.classList.remove("showSidebar");
    }
  };

  // Close sidebar on path change
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  // Close sidebar on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const _user = localStorage.getItem("user");
  const user = JSON.parse(_user);
  const _permission = localStorage.getItem("permission");
  const permission = JSON.parse(_permission);

  return (
    <div className="p-3" ref={sidebarRef} id="sidebarArea">
      <div className="d-flex align-items-center justify-content-center">
        <h3 className="text-center">Church Admin</h3>
        <span className="ms-auto d-lg-none">
          <Button
            close
            size="sm"
            className="ms-auto d-lg-none"
            onClick={() => showMobilemenu()}
          ></Button>
        </span>
      </div>
      <div className="pt-4 mt-2">
        <Nav vertical className="sidebarNav">
          {user?.role === "super" && (
            <NavItem className="sidenav-bg">
              <Link
                to="/admin/user_list"
                className={
                  location.pathname === "/admin/user_list"
                    ? "text-primary nav-link py-3"
                    : "nav-link text-secondary py-3"
                }
              >
                <i className="bi bi-people"></i>
                <span className="ms-3 d-inline-block">Users</span>
              </Link>
            </NavItem>
          )}
          {(user?.role === "super" ||
            permission?.churchPermission === true) && (
            <NavItem className="sidenav-bg">
              <Link
                to="/admin/church_list"
                className={
                  location.pathname === "/admin/church_list"
                    ? "text-primary nav-link py-3"
                    : "nav-link text-secondary py-3"
                }
              >
                <i className="bi bi-bank"></i>
                <span className="ms-3 d-inline-block">Churches</span>
              </Link>
            </NavItem>
          )}
          {(user?.role === "super" ||
            permission?.notificationPermission === true) && (
            <NavItem className="sidenav-bg">
              <Link
                to="/admin/notification_list"
                className={
                  location.pathname === "/admin/notification_list"
                    ? "text-primary nav-link py-3"
                    : "nav-link text-secondary py-3"
                }
              >
                <i className="bi bi-bell"></i>
                <span className="ms-3 d-inline-block">Notifications</span>
              </Link>
            </NavItem>
          )}
          {(user?.role === "super" ||
            permission?.notificationPermission === true) && (
            <NavItem className="sidenav-bg">
              <Link
                to="/admin/transaction_list"
                className={
                  location.pathname === "/admin/transaction_list"
                    ? "text-primary nav-link py-3"
                    : "nav-link text-secondary py-3"
                }
              >
                <i className="bi bi-credit-card"></i>
                <span className="ms-3 d-inline-block">Transactions</span>
              </Link>
            </NavItem>
          )}
          {user?.role === "super" && (
            <NavItem className="sidenav-bg">
              <Link
                to="/admin/roles"
                className={
                  location.pathname === "/admin/roles"
                    ? "text-primary nav-link py-3"
                    : "nav-link text-secondary py-3"
                }
              >
                <i className="bi bi-diamond"></i>
                <span className="ms-3 d-inline-block">SubAdmins</span>
              </Link>
            </NavItem>
          )}
        </Nav>
      </div>
    </div>
  );
};

export default Sidebar;
