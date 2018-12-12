drop schema `jinjiecheng_checkout`;
-- drop user `mg`;

CREATE SCHEMA `jinjiecheng_checkout` ;
-- CREATE USER 'jin' IDENTIFIED BY 'jiecheng';

GRANT ALL privileges ON jinjiecheng_checkout.* TO 'jin'@'%' IDENTIFIED BY 'jiecheng';

