drop table if exists order_item;
drop table if exists `order_info`;
drop table if exists order_biz_sign;
drop table if exists order_user_balance;
DROP TABLE IF EXISTS `order_payment`;
DROP TABLE IF EXISTS `order_address`;


/*==============================================================*/
/* Table: "order_info"                                               */
/*==============================================================*/
CREATE TABLE `order_info` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `user_id` bigint(11) NOT NULL,
  `date_id` bigint(11) DEFAULT NULL,
  `biz_id` bigint(11) NOT NULL,
  `biz_name` varchar(256) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0,
  `quantity` decimal(10,2)  NOT NULL DEFAULT 0,
  `user_name` varchar(32) DEFAULT NULL,
  `name` varchar(32) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `zipcode` varchar(20) DEFAULT NULL,
  `city` varchar(32) DEFAULT NULL,
  `state` varchar(32) DEFAULT NULL,
  `status` varchar(32) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint(11) NOT NULL,
  `updated_by` bigint(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

Alter table order_info add column status_msg varchar(128) DEFAULT NULL;
Alter table order_info add column note varchar(256) DEFAULT NULL;

/*==============================================================*/
/* Table: order_item                                            */
/*==============================================================*/
CREATE TABLE `order_item` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `order_id` bigint(11) NOT NULL,
  `product_id` bigint(11) NOT NULL,
  `product_name` varchar(256) NOT NULL,
  `product_code` varchar(256) NOT NULL,
  `quantity` decimal(10,2)  NOT NULL DEFAULT 0,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0,
  `amount` decimal(10,2) NOT NULL DEFAULT 0,
  `status` varchar(32) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint(11) NOT NULL,
  `updated_by` bigint(11) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `order_item_order_info` FOREIGN KEY (`order_id`) REFERENCES `order_info` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
Alter table order_item add column supplier_id bigint(11) DEFAULT NULL;
Alter table order_item add column supplier_name varchar(256) DEFAULT NULL;
Alter table order_item add column note varchar(128) DEFAULT NULL;
ALTER TABLE order_item ADD `unit_of_measure` varchar(100) DEFAULT NULL;


/*==============================================================*/
/* Table: change_history                                           */
/*==============================================================*/
CREATE TABLE `change_history` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `item_id` bigint(11) NOT NULL,
  `item_type` varchar(16) NOT NULL,
  `change_msg` varchar(256) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_user` varchar(16) DEFAULT NULL,
  `created_by` bigint(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*==============================================================*/
/* Table: order_biz_sign                                   */
/*==============================================================*/
CREATE TABLE `order_biz_sign` (
  `biz_id` bigint(11) NOT NULL,
  `tenant` varchar(32) NOT NULL,
  `sign_key` varchar(250) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`biz_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*==============================================================*/
/* Table: order_user_balance                                     */
/*==============================================================*/
CREATE TABLE `order_user_balance` (
  `id` bigint(11) NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `user_id` bigint(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0,
  `balance` decimal(10,2) NOT NULL DEFAULT 0,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


/*==============================================================*/
/* Table: order_payment                                    */
/*==============================================================*/
CREATE TABLE `order_payment` (
    `id` bigint(11) NOT NULL AUTO_INCREMENT,
    `tenant` varchar(32) NOT NULL,
    `payment_nonce` varchar(60) NOT NULL,
    `order_id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `biz_id` int(11) NOT NULL,
    `payment_info` varchar(200) DEFAULT NULL,
    `payment_type` varchar(32) NOT NULL,
    `payment_status` varchar(32) NOT NULL,
    `payment_due` decimal(10,2) NOT NULL DEFAULT 0,
    `payment_actual` decimal(10,2) NOT NULL DEFAULT 0,
    `payment_refund` decimal(10,2) NOT NULL DEFAULT 0,
    `parent_payment_id` int(11),
    `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     `created_by` bigint(11) NOT NULL,
     `updated_by` bigint(11) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `payment_nonce_uk` (`payment_nonce`) USING BTREE
) ENGINE=InnoDB  DEFAULT CHARSET=utf8;

/*==============================================================*/
/* Table: delivery_address                                    */
/*==============================================================*/
CREATE TABLE `order_address` (
  `id` bigint(11) unsigned NOT NULL AUTO_INCREMENT,
  `tenant` varchar(32) NOT NULL,
  `user_id` bigint(11) unsigned NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  `zipcode` varchar(20) DEFAULT NULL,
  `city` varchar(32) DEFAULT NULL,
  `state` varchar(32) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint(11) NOT NULL,
  `updated_by` bigint(11) NOT NULL,
  `primary_flag` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;