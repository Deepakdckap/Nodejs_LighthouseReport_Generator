CREATE DATABASE lighthouse;

USE lighthouse;

CREATE TABLE qa_lighthouse(
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    projectNameWithTime VARCHAR (255),
    hidden_p_n varchar(255),
    siteURL VARCHAR (255),
    filePath VARCHAR (255),
    created_at timestamp,
    updated_at timestamp
);