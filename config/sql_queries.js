/**
 * Created by Fecny on 2017. 04. 18..
 */
// config/database.js
module.exports = {
    "get-account": "SELECT accounts.*, (SELECT account_roles.roles_id from account_roles WHERE account_roles.accounts_id = accounts.id) as account_roles, (SELECT group_concat(roles_levels.level separator '|') from roles_levels WHERE roles_levels.roles_id = account_roles) as role_access, (SELECT group_concat(account_factories.factory_id separator '|') from account_factories WHERE account_factories.accounts_id = accounts.id) as account_factories FROM accounts WHERE accounts.id = '<!account_id!>'",
    "get-account-login": "SELECT accounts.*, (SELECT account_roles.roles_id from account_roles WHERE account_roles.accounts_id = accounts.id) as account_roles, (SELECT group_concat(roles_levels.level separator '|') from roles_levels WHERE roles_levels.roles_id = account_roles) as role_access, (SELECT group_concat(account_factories.factory_id separator '|') from account_factories WHERE account_factories.accounts_id = accounts.id) as account_factories FROM accounts WHERE accounts.email = '<!account_email!>'",

    "get-factories-all": "SELECT tbfactory.*,factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id)",
    "get-factories-user": "SELECT tbfactory.*,factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id) WHERE fact_id IN (SELECT account_factories.factory_id FROM account_factories WHERE account_factories.accounts_id = '<!account_id!>')",
    "get-factories-id": "SELECT tbfactory.*,factory_datas.* FROM tbfactory INNER JOIN factory_datas on(tbfactory.fact_id = factory_datas.factory_id) WHERE fact_id = '<!factory_id!>'",

    "get-cells-user": "SELECT tbcell.*, (SELECT short_name from factory_datas WHERE factory_id = cell_fact_id) as short_name, licences.licence_id, licences.licence_number, CAST(licences.start  AS char) as licence_start, CAST(licences.end  AS char) as licence_end, DATEDIFF(NOW(), licences.end) as licence_end_diff, status as cellStatus, last_online from tbcell LEFT OUTER JOIN cellStatus on (cellStatus.cell_id = tbcell.cell_id) LEFT OUTER JOIN licences on (licence_id = (SELECT licence_id FROM licences WHERE licences.cell_id = tbcell.cell_id ORDER by end desc limit 1)) WHERE cell_fact_id IN (SELECT account_factories.factory_id FROM account_factories WHERE account_factories.accounts_id = '<!account_id!>') ORDER by cell_fact_id, cell_name",
    "get-cells-id": "SELECT tbcell.*, (SELECT short_name from factory_datas WHERE factory_id = cell_fact_id) as short_name, licences.licence_id, licences.licence_number, CAST(licences.start  AS char) as licence_start, CAST(licences.end  AS char) as licence_end, DATEDIFF(NOW(), licences.end) as licence_end_diff, status as cellStatus, last_online from tbcell LEFT OUTER JOIN cellStatus on (cellStatus.cell_id = tbcell.cell_id) LEFT OUTER JOIN licences on (licence_id = (SELECT licence_id FROM licences WHERE licences.cell_id = tbcell.cell_id ORDER by end desc limit 1)) WHERE tbcell.cell_id = '<!cell_id!>'",
    "get-cells-factory": "SELECT tbcell.*, (SELECT short_name from factory_datas WHERE factory_id = cell_fact_id) as short_name, licences.licence_id, licences.licence_number, CAST(licences.start  AS char) as licence_start, CAST(licences.end  AS char) as licence_end, DATEDIFF(NOW(), licences.end) as licence_end_diff, status as cellStatus, last_online from tbcell LEFT OUTER JOIN cellStatus on (cellStatus.cell_id = tbcell.cell_id) LEFT OUTER JOIN licences on (licence_id = (SELECT licence_id FROM licences WHERE licences.cell_id = tbcell.cell_id ORDER by end desc limit 1)) WHERE tbcell.cell_fact_id = '<!factory_id!>'",

    "get-shifts-user": "SELECT factory_shifts.*, tbcell.cell_name as cell_name, factory_datas.short_name as factory_name from factory_shifts LEFT OUTER JOIN tbcell on (tbcell.cell_id = factory_shifts.cell_id) LEFT OUTER JOIN factory_datas on (factory_datas.factory_id = factory_shifts.factory_id) WHERE factory_shifts.factory_id IN (SELECT account_factories.factory_id FROM account_factories WHERE account_factories.accounts_id = '<!account_id!>')",
    "get-shift-id": "SELECT factory_shifts.*, tbcell.cell_name as cell_name, factory_datas.short_name as factory_name from factory_shifts LEFT OUTER JOIN tbcell on (tbcell.cell_id = factory_shifts.cell_id) LEFT OUTER JOIN factory_datas on (factory_datas.factory_id = factory_shifts.factory_id) WHERE factory_shifts.factory_shift_id = '<!shift_id!>'",

    "get-devices-cell": "SELECT\
            tbdevice.dev_id,\
                CONCAT_WS(' - ', tbethernetconfigurationinformation.etci_hostname, CONCAT_WS(\
                    ' ',\
                    tbdevicetype.dtyp_name,\
                    tbversioninformation.vinf_default_personality\
                )) AS deviceType,\
                deviceStatus.`status` AS deviceStatus,\
                CAST(deviceStatus.last_online AS char) AS last_online,\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'UO' AND iosi_index = 3) ORDER by iosi_timestamp DESC LIMIT 1) as 'UO3',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'SO' AND iosi_index = 1) ORDER by iosi_timestamp DESC LIMIT 1) as 'SO1',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'UO' AND iosi_index = 6) ORDER by iosi_timestamp DESC LIMIT 1) as 'UO6',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'SO' AND iosi_index = 3) ORDER by iosi_timestamp DESC LIMIT 1) as 'SO3',\
                (SELECT ROUND(time_to_sec((TIMEDIFF(NOW(), iosi_timestamp))) / 60) from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id ORDER by iosi_timestamp DESC LIMIT 1) as 'programstatus_last_update'\
            FROM\
            tbdevice\
            RIGHT OUTER JOIN tbdevicetype ON (\
                tbdevicetype.dtyp_id = tbdevice.dev_dtyp_id\
            )\
            LEFT JOIN deviceStatus ON (\
                deviceStatus.device_id = tbdevice.dev_id\
            )\
            LEFT JOIN tbethernetconfigurationinformation ON (\
                tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id\
                AND\
                tbethernetconfigurationinformation.etci_timestamp = (\
                SELECT tbethernetconfigurationinformation.etci_timestamp FROM tbethernetconfigurationinformation\
                WHERE tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id ORDER BY tbethernetconfigurationinformation.etci_timestamp DESC LIMIT 1))\
            \
            LEFT JOIN tbversioninformation ON (\
                tbversioninformation.vinf_dev_id = tbdevice.dev_id\
                AND\
                tbversioninformation.vinf_timestamp = (\
                SELECT tbversioninformation.vinf_timestamp FROM tbversioninformation\
                WHERE tbversioninformation.vinf_dev_id = tbdevice.dev_id ORDER BY tbversioninformation.vinf_timestamp DESC LIMIT 1))\
            WHERE tbdevice.dev_cell_id = '<!selected_cell!>'",


    "get-devices-id": "SELECT\
            tbdevice.*,\
                CONCAT_WS(' - ', tbethernetconfigurationinformation.etci_hostname, CONCAT_WS(\
                    ' ',\
                    tbdevicetype.dtyp_name,\
                    tbversioninformation.vinf_default_personality\
                )) AS deviceType,\
                deviceStatus.`status` AS deviceStatus,\
                CAST(deviceStatus.last_online AS char) AS last_online,\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'UO' AND iosi_index = 3) ORDER by iosi_timestamp DESC LIMIT 1) as 'UO3',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'SO' AND iosi_index = 1) ORDER by iosi_timestamp DESC LIMIT 1) as 'SO1',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'UO' AND iosi_index = 6) ORDER by iosi_timestamp DESC LIMIT 1) as 'UO6',\
                (SELECT iosi_state from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id AND (iosi_type = 'SO' AND iosi_index = 3) ORDER by iosi_timestamp DESC LIMIT 1) as 'SO3',\
                (SELECT ROUND(time_to_sec((TIMEDIFF(NOW(), iosi_timestamp))) / 60) from tbiostatusinformation WHERE iosi_dev_id = tbdevice.dev_id ORDER by iosi_timestamp DESC LIMIT 1) as 'programstatus_last_update'\
            FROM\
            tbdevice\
            RIGHT OUTER JOIN tbdevicetype ON (\
                tbdevicetype.dtyp_id = tbdevice.dev_dtyp_id\
            )\
            LEFT JOIN deviceStatus ON (\
                deviceStatus.device_id = tbdevice.dev_id\
            )\
            LEFT JOIN tbethernetconfigurationinformation ON (\
                tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id\
                AND\
                tbethernetconfigurationinformation.etci_timestamp = (\
                SELECT tbethernetconfigurationinformation.etci_timestamp FROM tbethernetconfigurationinformation\
                WHERE tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id ORDER BY tbethernetconfigurationinformation.etci_timestamp DESC LIMIT 1))\
            \
            LEFT JOIN tbversioninformation ON (\
                tbversioninformation.vinf_dev_id = tbdevice.dev_id\
                AND\
                tbversioninformation.vinf_timestamp = (\
                SELECT tbversioninformation.vinf_timestamp FROM tbversioninformation\
                WHERE tbversioninformation.vinf_dev_id = tbdevice.dev_id ORDER BY tbversioninformation.vinf_timestamp DESC LIMIT 1))\
            WHERE tbdevice.dev_id = '<!device_id!>'",


    "get-notifications-unique-where": "SELECT\
            tberror.*, tbfanucerrorlevels.*, tbfanucerrors.err_cause, tbfanucerrors.err_remedy, CONCAT_WS(' - ',tbethernetconfigurationinformation.etci_hostname,\
                CONCAT_WS(' ',tbdevicetype.dtyp_name,tbversioninformation.vinf_default_personality)\
            ) AS deviceType,\
            tbcell.cell_name as cell_name,\
            factory_datas.short_name as factory_name\
        FROM\
            tberror\
        RIGHT JOIN tbfanucerrors ON (tbfanucerrors.err_code = tberror.err_code)\
        RIGHT JOIN tbfanucerrorlevels ON (tbfanucerrorlevels.err_type = tbfanucerrors.err_type)\
        RIGHT OUTER JOIN tbdevice ON (tbdevice.dev_id = tberror.err_dev_id)\
        RIGHT OUTER JOIN tbdevicetype ON (tbdevicetype.dtyp_id = tbdevice.dev_dtyp_id)\
        LEFT JOIN tbethernetconfigurationinformation ON (\
            tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id\
            AND tbethernetconfigurationinformation.etci_timestamp = (\
                SELECT\
                    tbethernetconfigurationinformation.etci_timestamp\
                FROM\
                    tbethernetconfigurationinformation\
                WHERE\
                    tbethernetconfigurationinformation.etci_dev_id = tbdevice.dev_id\
                ORDER BY\
                    tbethernetconfigurationinformation.etci_timestamp DESC\
                LIMIT 1\
            )\
        )\
        LEFT JOIN tbversioninformation ON (\
            tbversioninformation.vinf_dev_id = tbdevice.dev_id\
            AND tbversioninformation.vinf_timestamp = (\
                SELECT\
                    tbversioninformation.vinf_timestamp\
                FROM\
                    tbversioninformation\
                WHERE\
                    tbversioninformation.vinf_dev_id = tbdevice.dev_id\
                ORDER BY\
                    tbversioninformation.vinf_timestamp DESC\
                LIMIT 1\
            )\
        )\
        RIGHT OUTER JOIN tbcell ON (tbcell.cell_id = tbdevice.dev_cell_id)\
        RIGHT OUTER JOIN factory_datas ON (factory_datas.factory_id = tbcell.cell_fact_id)\
        WHERE <!where!>\
        GROUP by err_id ORDER by err_device_timestamp DESC"
};