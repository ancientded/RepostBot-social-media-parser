create database socialsparsertelegrambotdb;
use socialsparsertelegrambotdb;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


--
-- База данных: `socialsparsertelegrambotdb`
--

-- --------------------------------------------------------

--
-- Структура таблицы `admin`
--

CREATE TABLE `admin` (
  `adminID` int(11) NOT NULL,
  `chatIdentifier` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `admincommunity`
--

CREATE TABLE `admincommunity` (
  `communityID` int(11) NOT NULL,
  `adminID` int(11) NOT NULL,
  `comunityName` text CHARACTER SET utf8mb4 NOT NULL,
  `communityIdentifier` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `adminsocial`
--

CREATE TABLE `adminsocial` (
  `adminSocialID` int(11) NOT NULL,
  `adminID` int(11) NOT NULL,
  `socialID` int(11) NOT NULL,
  `sourceURL` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `socialnetwork`
--

CREATE TABLE `socialnetwork` (
  `socialID` int(11) NOT NULL,
  `name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `socialnetwork`
--

INSERT INTO `socialnetwork` (`socialID`, `name`) VALUES
(1, 'instagram'),
(2, 'facebook'),
(3, 'twitter');

-- --------------------------------------------------------

--
-- Структура таблицы `socialpost`
--

CREATE TABLE `socialpost` (
  `postID` int(11) NOT NULL,
  `adminSocialID` int(11) NOT NULL,
  `sourceURL` text NOT NULL,
  `communityIdentifier` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`adminID`);

--
-- Индексы таблицы `admincommunity`
--
ALTER TABLE `admincommunity`
  ADD PRIMARY KEY (`communityID`),
  ADD KEY `fk_Admin_to_AdminCommunity` (`adminID`);

--
-- Индексы таблицы `adminsocial`
--
ALTER TABLE `adminsocial`
  ADD PRIMARY KEY (`adminSocialID`),
  ADD KEY `fk_AdminCommunity_to_AdminSocial` (`adminID`),
  ADD KEY `fk_SocialNetwork_to_AdminSocial` (`socialID`);

--
-- Индексы таблицы `socialnetwork`
--
ALTER TABLE `socialnetwork`
  ADD PRIMARY KEY (`socialID`);

--
-- Индексы таблицы `socialpost`
--
ALTER TABLE `socialpost`
  ADD PRIMARY KEY (`postID`),
  ADD KEY `fk_AdminSocial_to_SocialPost` (`adminSocialID`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `admin`
--
ALTER TABLE `admin`
  MODIFY `adminID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT для таблицы `admincommunity`
--
ALTER TABLE `admincommunity`
  MODIFY `communityID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT для таблицы `adminsocial`
--
ALTER TABLE `adminsocial`
  MODIFY `adminSocialID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT для таблицы `socialnetwork`
--
ALTER TABLE `socialnetwork`
  MODIFY `socialID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT для таблицы `socialpost`
--
ALTER TABLE `socialpost`
  MODIFY `postID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `admincommunity`
--
ALTER TABLE `admincommunity`
  ADD CONSTRAINT `fk_Admin_to_AdminCommunity` FOREIGN KEY (`adminID`) REFERENCES `admin` (`adminID`);

--
-- Ограничения внешнего ключа таблицы `adminsocial`
--
ALTER TABLE `adminsocial`
  ADD CONSTRAINT `fk_AdminCommunity_to_AdminSocial` FOREIGN KEY (`adminID`) REFERENCES `admin` (`adminID`),
  ADD CONSTRAINT `fk_SocialNetwork_to_AdminSocial` FOREIGN KEY (`socialID`) REFERENCES `socialnetwork` (`socialID`);

--
-- Ограничения внешнего ключа таблицы `socialpost`
--
ALTER TABLE `socialpost`
  ADD CONSTRAINT `fk_AdminSocial_to_SocialPost` FOREIGN KEY (`adminSocialID`) REFERENCES `adminsocial` (`adminSocialID`);
COMMIT;

