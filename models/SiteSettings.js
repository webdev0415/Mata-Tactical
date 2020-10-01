import { Model, DataTypes } from "sequelize";

export class SiteSettings extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        instagram_media_links: {
          type: DataTypes.STRING(255),
        },
        facebook_media_links: {
          type: DataTypes.STRING(255),
        },
        contact_us_page_info: {
          type: DataTypes.TEXT,
        },
        contact_us_email_address: {
          type: DataTypes.STRING(50),
        },
        commentsOption: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        termsOption: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        backgroundOption: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        backgroundID: {
          type: DataTypes.UUID,
        },
        hide_comments: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        menu_color: {
          type: DataTypes.STRING(50),
        },
        footer_color: {
          type: DataTypes.STRING(50),
        },
        header1_color: {
          type: DataTypes.STRING(50),
        },
        header2_color: {
          type: DataTypes.STRING(50),
        },
        table_header_color: {
          type: DataTypes.STRING(50),
        },
        table_content_color: {
          type: DataTypes.STRING(50),
        },
        form_color: {
          type: DataTypes.STRING(50),
        },
        paragraph_color: {
          type: DataTypes.STRING(50),
        },
        special_color: {
          type: DataTypes.STRING(50),
        },
        terms: {
          type: DataTypes.TEXT,
        },
        header_background_color: {
          type: DataTypes.STRING(50),
        },
        footer_background_color: {
          type: DataTypes.STRING(50),
        },
        queued_webinar_limit: {
          type: DataTypes.INTEGER,
        },
          time_zone: {
            type: DataTypes.STRING(50),
          }
      },
      {
        sequelize,
        tableName: "site_settings",
      }
    );
  }
}
