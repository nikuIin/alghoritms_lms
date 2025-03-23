from sqlalchemy import text
from core.config import ROLE_SETTING

CHECK_USER_EXISTS_BY_LOGIN = text(
    """
    select 1
    from "user"
    where user_login=:user_login
    """
)

CHECK_USER_EXISTS_BY_EMAIL = text(
    """
    select 1
    from "user"
    where email=:user_email
    """
)

GET_USERS_LOGINS = text(
    f"""
    select user_login
    from "user"
    where role_id = {ROLE_SETTING.user_role_id}
    """
)

CHECK_USER_EXISTS_BY_PHONE = text(
    """
    select 1
    from "user"
    where phone=:user_phone
    """
)

GET_USER_CREDENTIALS = text(
    """
    select
        user_login,
        password
    from "user"
    where user_login=:user_login
    """
)

GET_BASE_USER_INFO_BY_LOGIN = text(
    """
    select
        user_login,
        email,
        phone,
        role_id
    from "user"
    where user_login=:user_login
    """
)

SELECT_ALL_USERS_INFO = text(
    """
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    order by second_name, first_name, patronymic
    """
)

SELECT_USERS = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where role_id = {ROLE_SETTING.user_role_id} 
    order by second_name, first_name, patronymic
    """
)

SELECT_ADMINS = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where role_id = {ROLE_SETTING.admin_role_id} 
    order by second_name, first_name, patronymic
    """
)

SELECT_TEACHERS = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where role_id = {ROLE_SETTING.teacher_role_id} 
    order by second_name, first_name, patronymic
    """
)

GET_USER_BY_LOGIN = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where user_login=:user_login 
    """
)

GET_USER_BY_EMAIL = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where email=:user_email
    """
)

GET_USER_BY_PHONE = text(
    f"""
    select
        user_login,
        email,
        phone,
        role_id,
        first_name,
        second_name,
        patronymic,
        additional_info,
        registration_date
    from "user"
    join md_user using(user_login)
    where phone=:user_phone
    """
)

INSERT_USER = text(
    """
    insert into "user" 
    values 
      (:user_login, :email, :phone, :password, :role_id)
    """
)

INSERT_MD_USER = text(
    """
    insert into md_user
    values
      (:user_login, :first_name, :second_name, :patronymic, :additional_info)
    """
)
