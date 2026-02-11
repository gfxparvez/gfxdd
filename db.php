<?php
// PHP Connector for JSON-based DB
// Mimics a MySQL feel

class DbConnector {
    private $db_file;
    private $api_key;
    private $api_url;

    public function __construct($api_key, $api_url = null) {
        $this->api_key = $api_key;
        $this->api_url = $api_url ?: (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . "/api/db-api";
    }

    private function request($action, $table, $params = []) {
        $data = array_merge([
            'api_key' => $this->api_key,
            'action' => $action,
            'table' => $table
        ], $params);

        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n",
                'method'  => 'POST',
                'content' => json_encode($data)
            ]
        ];
        $context  = stream_context_create($options);
        $result = file_get_contents($this->api_url, false, $context);
        if ($result === FALSE) return null;
        return json_decode($result, true);
    }

    public function select($table, $filters = null) {
        return $this->request('select', $table, ['filters' => $filters]);
    }

    public function insert($table, $data) {
        return $this->request('insert', $table, ['data' => $data]);
    }

    public function update($table, $row_id, $data) {
        return $this->request('update', $table, ['row_id' => $row_id, 'data' => $data]);
    }

    public function delete($table, $row_id) {
        return $this->request('delete', $table, ['row_id' => $row_id]);
    }
}

// Usage example:
// $db = new DbConnector('YOUR_API_KEY');
// $results = $db->select('users');
?>
