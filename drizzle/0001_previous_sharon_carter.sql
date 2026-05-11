CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`totalMessages` int NOT NULL DEFAULT 0,
	`aiMessages` int NOT NULL DEFAULT 0,
	`humanMessages` int NOT NULL DEFAULT 0,
	`activeConversations` int NOT NULL DEFAULT 0,
	`escalationCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`whatsappPhoneNumber` varchar(20) NOT NULL,
	`phoneNumberId` varchar(255) NOT NULL,
	`accessToken` text NOT NULL,
	`verifyToken` varchar(255) NOT NULL,
	`agentName` varchar(255) NOT NULL,
	`agentPersona` text,
	`systemPrompt` text,
	`aiEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`customerPhoneNumber` varchar(20) NOT NULL,
	`customerName` varchar(255),
	`aiEnabled` boolean NOT NULL DEFAULT true,
	`isEscalated` boolean NOT NULL DEFAULT false,
	`isWaitingForHuman` boolean NOT NULL DEFAULT false,
	`lastMessageAt` timestamp,
	`unreadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`businessId` int NOT NULL,
	`reason` varchar(255),
	`triggerMessage` text,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`businessId` int NOT NULL,
	`whatsappMessageId` varchar(255),
	`senderType` enum('customer','business','ai') NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`deliveryStatus` enum('pending','sent','delivered','read','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `messages_whatsappMessageId_unique` UNIQUE(`whatsappMessageId`)
);
